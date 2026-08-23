# Accord: Intelligent Escrow for Verifiable Agreements

Accord is a consensus-driven escrow primitive built with GenLayer for agreements whose fulfillment cannot be determined by simple deterministic on-chain conditions.

It enables a customer to create an order, a merchant to accept the order and form an agreement, and the customer to fund an escrow. Once the merchant completes the work, evidence is submitted to the Intelligent Contract. GenLayer validators evaluate the evidence against the agreement requirements and reach a consensus decision that determines whether the escrow should be released to the merchant or refunded to the customer.

## The Problem

Traditional smart contracts are effective when fulfillment can be expressed through deterministic conditions.

For example:

- A payment was received.
- A deadline has passed.
- A signature is valid.
- A balance is sufficient.

However, many real-world agreements contain requirements that are semantic and cannot be evaluated through simple on-chain logic.

For example:

> "Build a responsive landing page with five sections, a contact form, and deploy it publicly."

A conventional smart contract cannot independently determine whether the submitted work satisfies those requirements.

Accord uses GenLayer's Intelligent Contract capabilities to make this type of agreement enforceable through validator consensus.

## How Accord Works

The lifecycle of an Accord agreement is:

```text
Customer creates order
        ↓
Order becomes available
        ↓
Merchant accepts order
        ↓
Agreement is created
        ↓
Customer funds escrow
        ↓
Merchant performs work
        ↓
Merchant submits evidence
        ↓
GenLayer validators evaluate evidence
        ↓
Consensus decision
        ↓
   ┌───────────────┐
   │               │
Satisfied      Not satisfied
   │               │
   ↓               ↓
Release          Refund
   │               │
   ↓               ↓
Merchant         Customer
