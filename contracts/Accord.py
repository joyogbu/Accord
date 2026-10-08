# {
#   "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6"
# }

from genlayer import *
from dataclasses import dataclass
import json
from datetime import datetime, timezone

#Interface used to send native GEN from the contract
# to an external recipient address.
@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass

#helper function for gen_to_wei
def gen_to_wei(amount: str) -> u256:
    if "." in amount:
        whole, decimal = amount.split(".")
        decimal = decimal.ljust(18, "0")
    else:
        whole = amount
        decimal = "0" * 18

    if len(decimal) > 18:
        raise gl.vm.UserError(
            "GEN amount cannot have more than 18 decimals"
        )

    return (
        u256(int(whole)) * u256(10**18)
        + u256(int(decimal))
    )

# Helper function to check for deadline
def _deadline_passed(agreement) -> bool:
    now = int(datetime.now(timezone.utc).timestamp())
    return now > agreement.deadline

#Stores the complete state of an agreement and its escrow.
@allow_storage
@dataclass
class Agreement:
    agreement_id: str

    payer: Address
    merchant: Address

    description: str
    requirements: str

    #All GEN amounts are stored in wei (1 GEN = 10^18 wei
    amount: u256
    currency: str

    #A reference to the agreement id
    payment_reference: str

    deadline: u64

    #the agreement state
    status: str

    #the state of the escrow
    escrow_status: str

    verification_result: str
    verification_reason: str
    verified: bool


class Accord(gl.Contract):

    # Persistent agreement storage
    agreements: TreeMap[str, Agreement]

    # Maps order ID (payment_reference) to agreement ID
    order_agreements: TreeMap[str, str]

    # Persistent evidence storage
    # One evidence record per agreement for now.
    evidence: TreeMap[str, str]

    def __init__(self):
        pass
        

    # =========================================================
    # CREATE AGREEMENT
    # =========================================================

    @gl.public.write
    def create_agreement(
        self,
        agreement_id: str,
        payer: str,
        merchant: str,
        description: str,
        requirements: str,
        amount: str,
        currency: str,
        payment_reference: str,
        deadline: u64
    ) -> None:

        # An agreement must have a unique identifier.
        if agreement_id == "":
            raise gl.vm.UserError(
                "Agreement ID is required"
            )

        if agreement_id in self.agreements:
            raise gl.vm.UserError(
                "Agreement already exists"
            )

        if payment_reference == "":
            raise gl.vm.UserError(
                "Payment reference is required"
            )

        if payment_reference in self.order_agreements:
            raise gl.vm.UserError(
                "An agreement already exists for this order"
            )

        amount_wei = gen_to_wei(amount)        
        payer_address = Address(payer)
        merchant_address = Address(merchant)

        now = u64(
            int(datetime.now(timezone.utc).timestamp())
        )

        if deadline <= now:
            raise gl.vm.UserError(
                "Agreement deadline must be in the future"
            )

        # Only the merchant specified in the agreement
        # is allowed to create it.
        if gl.message.sender_address != merchant_address:
            raise gl.vm.UserError(
                "Only the merchant can create the agreement"
            )

        # Prevent an address from acting as both payer and merchant.
        if payer_address == merchant_address:
            raise gl.vm.UserError(
                "Payer and merchant must be different"
            )

        # An escrow agreement must have a positive value.
        if amount_wei == u256(0):
            raise gl.vm.UserError(
                "Agreement amount must be greater than zero"
            )
            
        if description == "":
            raise gl.vm.UserError(
                "Description is required"
            )

        if requirements == "":
            raise gl.vm.UserError(
                "Requirements are required"
            )

        # Store the agreement in its initial state.
        agreement = Agreement(
            agreement_id=agreement_id,

            payer=payer_address,
            merchant=merchant_address,

            description=description,
            requirements=requirements,

            amount=amount_wei,
            currency=currency,
            payment_reference=payment_reference,
            deadline=deadline,

            status="CREATED",
            escrow_status="UNFUNDED",

            verification_result="PENDING",
            verification_reason="",
            verified=False
        )

        # Store agreement by agreement ID
        self.agreements[agreement_id] = agreement

        # Store the order → agreement relationship.
        self.order_agreements[payment_reference] = agreement_id

    # =========================================================
    # FUND ESCROW
    # =========================================================
    @gl.public.write.payable
    def fund_escrow(
        self,
        agreement_id: str
    ) -> None:

        # If the agreement does not exist, return any
        # GEN sent with the transaction to the sender.
        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        if gl.message.sender_address != agreement.payer:
            raise gl.vm.UserError(
                "Only the payer can fund the escrow"
            )

        if _deadline_passed(agreement):
            raise gl.vm.UserError(
                "The agreement deadline has passed"
            )

        if agreement.status != "CREATED":
            raise gl.vm.UserError(
                "Agreement is not available for funding in its present state"
            )

        if agreement.escrow_status != "UNFUNDED":
            raise gl.vm.UserError(
                "Escrow is already funded"
            )

        if gl.message.value != agreement.amount:
            raise gl.vm.UserError(
                "Incorrect funding amount"
            )


        # The exact agreed amount has been received,
        # so the escrow is now funded.
        agreement.status = "FUNDED"
        agreement.escrow_status = "FUNDED"

        self.agreements[agreement_id] = agreement

        #return
    # =========================================================
    # SUBMIT EVIDENCE
    # =========================================================

    @gl.public.write
    def submit_evidence(
        self,
        agreement_id: str,
        evidence_url: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        if gl.message.sender_address != agreement.merchant:
            raise gl.vm.UserError(
                "Only the merchant can submit evidence"
            )

        if not (
            agreement.status == "FUNDED"
            or (
                agreement.status == "EVIDENCE_SUBMITTED"
                and agreement.verification_result == "RETRY"
            )
        ):
            raise gl.vm.UserError(
                "Evidence cannot be submitted in the current agreement state"
            )

        if _deadline_passed(agreement):
            raise gl.vm.UserError(
                "The agreement deadline has passed"
            )

        if evidence_url == "":
            raise gl.vm.UserError(
                "Evidence URL cannot be empty"
            )

        if not (
            evidence_url.startswith("https://")
            or evidence_url.startswith("http://")
        ):
            raise gl.vm.UserError(
                "Evidence must be a valid HTTP or HTTPS URL"
            )


        # Store the submitted evidence.
        # This will later be evaluated by verify_agreement().
        self.evidence[agreement_id] = evidence_url

        agreement.status = "EVIDENCE_SUBMITTED"

        # Reset verification state for the new evidence.
        agreement.verification_result = "PENDING"
        agreement.verification_reason = ""
        agreement.verified = False

        self.agreements[agreement_id] = agreement
    
    # ============================================================
    # CANCEL AGREEMENT - MERCHANT
    # ============================================================

    @gl.public.write
    def cancel_by_merchant(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        # Only the merchant can cancel from this method
        if gl.message.sender_address != agreement.merchant:
            raise gl.vm.UserError(
                "Only the merchant can cancel the agreement"
            )

        # Cancellation is only allowed before evidence is submitted
        if agreement.status not in ["CREATED", "FUNDED"]:
            raise gl.vm.UserError(
                "Agreement can no longer be cancelled"
            )
        
        # If the payer has already funded escrow,
        # refund the escrow to the payer.
        if agreement.escrow_status == "FUNDED":
            self.refund_escrow(agreement_id)
            
            agreement = self.agreements[agreement_id]

        #mark the agreement as cancelled
        agreement.status = "CANCELLED"

        self.agreements[agreement_id] = agreement
    
    # ============================================================
    # CANCEL AGREEMENT - PAYER
    # ============================================================

    @gl.public.write
    def cancel_by_payer(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        # Only the payer/customer can cancel
        if gl.message.sender_address != agreement.payer:
            raise gl.vm.UserError(
                "Only the payer can cancel the agreement"
            )

        # Payer can only cancel before escrow is funded
        if agreement.status != "CREATED":
            raise gl.vm.UserError(
                "Payer can only cancel before the agreement is funded"
            )

        # No escrow exists yet, so there is nothing to refund
        agreement.status = "CANCELLED"

        self.agreements[agreement_id] = agreement

    #The payer can reject the work based on the evidence submitted
    @gl.public.write
    def reject_agreement(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        if gl.message.sender_address != agreement.payer:
            raise gl.vm.UserError(
                "Only the customer can reject the agreement"
            )

        # The payer can only reject after the merchant
        # has submitted evidence for review.
        if agreement.status != "EVIDENCE_SUBMITTED":
            raise gl.vm.UserError(
                "Agreement is not awaiting customer review"
            )

        agreement.status = "DISPUTED"

        self.agreements[agreement_id] = agreement


    # =========================================================
    # VERIFY AGREEMENT USING GENLAYER CONSENSUS
    # =========================================================

    @gl.public.write
    def verify_agreement(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        if agreement_id not in self.evidence:
            raise gl.vm.UserError(
                "No evidence submitted"
            )

        agreement = self.agreements[agreement_id]

        if agreement.status not in ["EVIDENCE_SUBMITTED", "DISPUTED"]:
            raise gl.vm.UserError(
                "Agreement is not ready for verification"
            )

        # Copy persistent agreement state into normal memory
        # before entering the non-deterministic consensus block.
        memory_agreement = gl.storage.copy_to_memory(
            agreement
        )

        evidence_url = self.evidence[agreement_id]

        def evaluate():

            web_content = None

            # Attempt evidence retrieval up to 3 times.
            for attempt in range(2):

                try:
                    web_content = gl.nondet.web.render(
                        evidence_url,
                        mode="text"
                    )

                    if web_content:
                        break

                except Exception:
                    web_content = None


            # Retrieval failure is NOT a rejection.
            if not web_content:
                return {
                    "retrieval_ok": False,
                    "fulfilled": False,
                    "reason": (
                        "The submitted deliverable could not be "
                        "retrieved after 2 attempts."
                    )
                }    

            prompt = f"""
    You are an independent agreement verification judge.

    Determine whether the submitted evidence demonstrates that
    the merchant fulfilled the agreed requirements.

    AGREEMENT DESCRIPTION:
    {memory_agreement.description}

    AGREED REQUIREMENTS:
    {memory_agreement.requirements}

    DELIVERABLE URL:
    {evidence_url}

    RETRIEVED DELIVERABLE CONTENT:
    {web_content}

    Evaluate the actual retrieved content against the requirements.
    
    Return ONLY valid JSON in exactly this format:

    {{
        "retrieval_ok": true,
        "fulfilled": true,
        "reason": "short explanation"
    }}

    Rules:

    1. "retrieval_ok" must be true because the deliverable was
   successfully retrieved.


    2. "fulfilled" must be true only when the retrieved deliverable
    reasonably demonstrates that the agreed requirements were satisfied.

    3. Do not rely on claims made by the merchant outside
   the retrieved deliverable.

    4. Do not invent functionality or facts that are not
   present in the retrieved content.

    5. Compare the actual deliverable against the agreed
   requirements.

    6. The agreement amount must not influence the decision.
    """

            response = gl.nondet.exec_prompt(
                prompt,
                response_format="json"
            )

            return response

        # GenLayer consensus / equivalence principle
        result = gl.eq_principle.prompt_comparative(
            evaluate,
            principle="""

The verification decision must be based on the independently
retrieved deliverable, not on claims supplied by the merchant.

Each evaluator must independently retrieve and evaluate
the submitted deliverable against the agreement
requirements.

The result must distinguish between:

1. successful retrieval with fulfillment,
2. successful retrieval without fulfillment,
3. retrieval failure.

A retrieval failure is NOT a rejection

If the deliverable cannot be retrieved or the retrieval
operation temporarily fails, the evaluator must return
retrieval_ok=false.

A retrieval failure must never cause the agreement to be
marked REJECTED or cause the escrow to be refunded.

The fulfilled decision must agree across independent
evaluations when the deliverable is successfully retrieved.

The explanation may differ in wording, but retrieval failure
must remain retryable.

"""
        )

        if not isinstance(result, dict):
            raise gl.vm.UserError(
                "Consensus returned an invalid verification result"
            )

        retrieval_ok = result.get(
            "retrieval_ok",
            False
        )

        fulfilled = result.get(
            "fulfilled",
            False
        )

        reason = result.get(
            "reason",
            ""
        )

        # RETRYABLE RETRIEVAL FAILURE

        if not retrieval_ok:

            agreement.status = "EVIDENCE_SUBMITTED"

            agreement.verification_result = "RETRY"

            agreement.verification_reason = (
                reason
                if reason
                else (
                    "Evidence could not be retrieved. "
                    "Verification can be retried."
                )
            )

            agreement.verified = False

            self.agreements[agreement_id] = agreement

            return

        # VERIFIED AS FULFILLED

        if fulfilled:

            agreement.verification_result = "FULFILLED"
            
            agreement.status = "FULFILLED"

            agreement.verification_reason = reason

            agreement.verified = True

            self.agreements[agreement_id] = agreement

            # Contract internally releases the escrow to the merchant
            self.release_escrow(agreement_id)

            return

        # VERIFIED AS NOT FULFILLED

        agreement.status = "REJECTED"

        agreement.verification_result = "REJECTED"

        agreement.verified = False

        agreement.verification_reason = reason

        self.agreements[agreement_id] = agreement

        # Contract internally refunds the escrow
        self.refund_escrow(agreement_id)

        return

    # =========================================================
    # RELEASE ESCROW
    # =========================================================

    
    def release_escrow(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        # Funds can only be released after verification
        # determines that the agreement was fulfilled.
        if agreement.status != "FULFILLED":
            raise gl.vm.UserError(
                "Agreement has not been verified as fulfilled"
            )

        # Prevent releasing an escrow more than once.
        if agreement.escrow_status != "FUNDED":
            raise gl.vm.UserError(
                "Escrow is not available for release"
            )

        amount = agreement.amount

        # Make sure the contract has enough GEN to complete
        # the transfer
        if self.balance < amount:
            raise gl.vm.UserError(
                "Insufficient escrow balance"
            )

        # Send the locked GEN to the merchant
        _Recipient(
            agreement.merchant
        ).emit_transfer(
            value=amount
        )

        # Mark the escrow as permanently released.
        agreement.escrow_status = "RELEASED"
        agreement.status = "RELEASED"

        self.agreements[agreement_id] = agreement


    # =========================================================
    # REFUND AFTER DEADLINE EXPIRY
    # =========================================================
        
    @gl.public.write
    def refund_after_deadline(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        if gl.message.sender_address != agreement.payer:
            raise gl.vm.UserError(
                "Only the payer can claim a deadline refund"
            )

        if agreement.escrow_status != "FUNDED":
            raise gl.vm.UserError(
                "Escrow is not available for refund"
            )
        
        if not _deadline_passed(agreement):
            raise gl.vm.UserError(
                "Agreement deadline has not passed"
            )

        agreement.status = "EXPIRED"
        agreement.verification_result = "EXPIRED"
        agreement.verification_reason = (
            "Merchant did not submit evidence before the deadline."
        )

        self.agreements[agreement_id] = agreement

        self.refund_escrow(agreement_id)



    # =========================================================
    # REFUND ESCROW
    # =========================================================

    
    def refund_escrow(
        self,
        agreement_id: str
    ) -> None:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        agreement = self.agreements[agreement_id]

        
        # Refunds are allowed after verification rejects
        # the agreement, or when a funded agreement is
        # cancelled by the merchant.
        if agreement.status not in ["REJECTED", "FUNDED", "EXPIRED"]:
            raise gl.vm.UserError(
                "Agreement is not eligible for refund"
            )

        # Prevent a second refund of the same escrow.
        if agreement.escrow_status != "FUNDED":
            raise gl.vm.UserError(
                "Escrow is not available for refund"
            )

        amount = agreement.amount

        if self.balance < amount:
            raise gl.vm.UserError(
                "Insufficient escrow balance"
            )

        # Return the locked GEN to the payer
        _Recipient(
            agreement.payer
        ).emit_transfer(
            value=amount
        )

        # Mark the escrow as refunded so it cannot be refunded again.
        agreement.escrow_status = "REFUNDED"
        agreement.status = "REFUNDED"

        self.agreements[agreement_id] = agreement

    # =========================================================
    # GET AGREEMENT
    # =========================================================

    @gl.public.view
    def get_agreement(
        self,
        agreement_id: str
    ) -> Agreement:

        if agreement_id not in self.agreements:
            raise gl.vm.UserError(
                "Agreement does not exist"
            )

        return self.agreements[agreement_id]

    # =========================================================
    # GET EVIDENCE
    # =========================================================

    @gl.public.view
    def get_evidence(
        self,
        agreement_id: str
    ) -> str:

        if agreement_id not in self.evidence:
            raise gl.vm.UserError(
                "No evidence submitted"
            )

        return self.evidence[agreement_id]

    @gl.public.view
    def get_agreement_state(
        self,
        agreement_id: str
    ) -> str:

        if agreement_id not in self.agreements:
            return "Agreement does not exist"

        agreement = self.agreements[agreement_id]

        return (
            "status=" + agreement.status
            + " | escrow_status=" + agreement.escrow_status
        )


    # =========================================================
    # CHECK AGREEMENT EXISTENCE
    # =========================================================

    @gl.public.view
    def agreement_exists(
        self,
        agreement_id: str
    ) -> bool:

        return agreement_id in self.agreements
