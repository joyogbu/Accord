# Accord

> **A machine-enforceable warranty layer for agent-to-agent commerce.**

Accord is a decentralized commerce protocol that combines **escrow, post-delivery evidence, and decentralized verification** to protect both sides of a digital transaction.

Traditional escrow protects the **transaction**: money is held until a predefined condition is met.

Accord adds a second layer: a **machine-enforceable warranty** that evaluates whether the delivered outcome actually satisfies the agreed requirements.

A customer funds an agreement with native **GEN**, a merchant completes the work and submits evidence, and a GenLayer Intelligent Contract uses decentralized web verification and consensus to determine whether the agreement was fulfilled.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Core Workflow](#core-workflow)
- [Key Concepts](#key-concepts)
- [Agreement Lifecycle](#agreement-lifecycle)
- [Escrow Lifecycle](#escrow-lifecycle)
- [Verification and Evidence](#verification-and-evidence)
- [Deadline Refunds](#deadline-refunds)
- [Order Cancellation](#order-cancellation)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Frontend](#frontend)
- [Supabase Data Layer](#supabase-data-layer)
- [Wallet and Network](#wallet-and-network)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Deploying to Vercel](#deploying-to-vercel)
- [Supabase Configuration](#supabase-configuration)
- [Security Considerations](#security-considerations)
- [Known Design Decisions](#known-design-decisions)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Accord is designed for marketplaces and agent-to-agent commerce where a transaction does not end when payment is made.

The protocol introduces a **post-delivery warranty mechanism**:

1. A customer creates an order.
2. A merchant accepts the order.
3. An agreement is created on-chain.
4. The customer funds the agreement with GEN.
5. The merchant performs the work.
6. The merchant submits a URL containing evidence of the completed work.
7. Accord sends the evidence through GenLayer's web rendering and consensus mechanism.
8. The agreement is either:
   - **Fulfilled** â†’ funds are released to the merchant.
   - **Rejected** â†’ funds are refunded to the customer.
   - **Retry** â†’ verification can be attempted again.
9. If the merchant never submits evidence before the deadline, the customer can claim a deadline refund.

The core idea is:

> **Escrow protects the payment. Accord's warranty layer protects the outcome.**

---

## The Problem

Escrow is useful for commerce, but it does not necessarily answer the most important question after delivery:

> **Did the merchant actually deliver what was agreed?**

For example, a customer could pay for:

- a completed website,
- a deployed application,
- a design,
- a report,
- a digital service,
- an API integration,
- or another verifiable digital deliverable.

Simply releasing funds after a payment or delivery event does not guarantee that the delivered result satisfies the agreement.

Traditional dispute systems often require a human or centralized platform to inspect evidence and decide who is right.

Accord explores a different model:

**Agreement â†’ Evidence â†’ Machine verification â†’ Consensus â†’ Settlement**

---

## The Solution

Accord combines four components:

### 1. On-chain agreement

The commercial terms are represented by a GenLayer Intelligent Contract.

The agreement contains information such as:

- customer/payer
- merchant
- description
- requirements
- amount
- currency
- order reference
- deadline
- agreement status
- escrow status
- verification result
- verification reason

### 2. On-chain escrow

The customer deposits native GEN into the agreement.

The funds remain controlled by the contract until one of the defined settlement conditions is reached.

### 3. Evidence submission

The merchant submits an HTTP/HTTPS URL containing evidence of the completed work.

The merchant does not automatically receive payment merely because evidence was submitted.

### 4. Decentralized verification

The evidence URL is rendered through GenLayer's nondeterministic web capability and evaluated through GenLayer consensus.

The verification result determines whether the escrow is released or refunded.

---

# Core Workflow

```text
Customer
   â”‚
   â”‚ Create Order
   â–¼
Order
   â”‚
   â”‚ Merchant accepts
   â–¼
Agreement Created
   â”‚
   â”‚ Customer funds
   â–¼
Escrow Funded
   â”‚
   â”‚ Merchant completes work
   â–¼
Evidence Submitted
   â”‚
   â”‚ Verify
   â–¼
GenLayer Consensus
   â”‚
   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚               â”‚
   â–¼               â–¼
FULFILLED       REJECTED
   â”‚               â”‚
   â–¼               â–¼
Release         Refund
Escrow          Customer
   â”‚
   â–¼
Merchant

If evidence is never submitted before the deadline:

FUNDED
   â”‚
   â”‚ deadline passes
   â–¼
Customer claims refund
   â”‚
   â–¼
EXPIRED + REFUNDED
```

---

# Key Concepts

## Order

An order represents the customer's request for a service or deliverable.

Orders are stored in Supabase and can have statuses such as:

- `OPEN`
- `ACCEPTED`
- `CANCELLED`

An order is a marketplace/application-level object.

---

## Agreement

An agreement represents the enforceable terms of an order.

It is stored both:

- on-chain in the GenLayer contract
- off-chain in Supabase for application/UI state

The agreement is the bridge between the order and the escrow/warranty mechanism.

---

## Escrow

Escrow represents the customer's locked funds.

Accord uses native **GEN** rather than USDC for its GenLayer Studionet escrow flow.

The escrow state is tracked separately from the agreement status.

---

## Evidence

Evidence is submitted by the merchant after completing the work.

The contract stores the evidence URL against the agreement.

The URL must use:

```text
http://
```

or:

```text
https://
```

Evidence submission does **not** automatically trigger verification.

The frontend explicitly initiates verification.

---

## Verification

Verification evaluates the submitted evidence against the agreement requirements.

GenLayer's web rendering capability is used to retrieve the evidence:

```python
gl.nondet.web.render(
    evidence_url,
    mode="text"
)
```
The verification result can be:

- `FULFILLED`
- `REJECTED`
- `RETRY`
- empty/pending state before verification completes

---

# Agreement Lifecycle

The primary agreement statuses are:

| Status | Meaning |
|---|---|
| `CREATED` | Agreement exists but has not been funded |
| `FUNDED` | Customer has funded the escrow |
| `EVIDENCE_SUBMITTED` | Merchant has submitted evidence |
| `FULFILLED` | Verification succeeded and work was accepted |
| `REJECTED` | Verification determined that the requirements were not satisfied |
| `EXPIRED` | Merchant failed to submit evidence before the deadline and the customer claimed the refund |
| `DISPUTED` | Agreement is in a dispute/reverification state |
| `CANCELLED` | Agreement was cancelled before funding |

The contract intentionally keeps **agreement status** separate from **escrow status**.

---

# Escrow Lifecycle

Escrow states are:

| Escrow Status | Meaning |
|---|---|
| `UNFUNDED` | No customer funds are locked |
| `FUNDED` | Customer funds are locked in the contract |
| `RELEASED` | Funds were released to the merchant |
| `REFUNDED` | Funds were returned to the customer |

This separation is important.

For example:

```text
Agreement:
    status = EXPIRED

Escrow:
    escrow_status = REFUNDED
```

means the agreement expired and the locked funds were returned to the customer.

Similarly:

```text
Agreement:
    status = FULFILLED

Escrow:
    escrow_status = RELEASED
```
means the agreement was successfully verified and the merchant received the escrow.

---

# Verification and Evidence

## Submit Evidence

The merchant submits evidence through:

```text
submit_evidence(agreement_id, evidence_url)
```

The contract verifies:

- the agreement exists
- the caller is the merchant
- the URL uses HTTP or HTTPS
- the agreement is in an eligible state

Evidence can be submitted when the agreement is:

```text
FUNDED
```

or when a previous verification attempt resulted in:

```text
RETRY
```
The contract does not automatically call verification after evidence submission.

This separation allows the application to explicitly control when verification begins.

---

## Verify Agreement

Verification requires evidence to exist.

Eligible verification states include:

```text
EVIDENCE_SUBMITTED
DISPUTED
```

The verification process:

1. Loads the agreement.
2. Loads the submitted evidence.
3. Renders the evidence URL.
4. Evaluates the rendered result against the agreement requirements.
5. Uses GenLayer consensus.
6. Updates the agreement state.
7. Settles the escrow when appropriate.

### Successful verification

```text
EVIDENCE_SUBMITTED
        â†“
    Verification
        â†“
    FULFILLED
        â†“
Escrow RELEASED
```

### Failed verification

```text
EVIDENCE_SUBMITTED
        â†“
    Verification
        â†“
     REJECTED
        â†“
Escrow REFUNDED
```

### Retrieval/verification problem

If the evidence cannot be reliably retrieved or evaluated:

```text
EVIDENCE_SUBMITTED
        â†“
      RETRY
```
The merchant can then submit/verify again according to the contract rules.

---

# Verification Transactions and Pending State

GenLayer verification can take longer than a normal EVM transaction.

The frontend therefore does not treat a client-side receipt timeout as proof that a transaction failed.

The application distinguishes between:

```text
SUCCESS
FAILED
PENDING
```

### SUCCESS

The transaction was confirmed and the contract state reflects the expected result.

### FAILED

The transaction was confirmed but execution returned an error.

### PENDING

The frontend stopped waiting for the receipt, but the transaction may still be processing.

In a pending state, the application should **check the agreement state rather than submit the same transaction again**.

This prevents accidental duplicate verification or claim transactions.

---

# Deadline Refunds

If a customer funds an agreement but the merchant never submits evidence before the deadline, the customer can invoke:

```text
refund_after_deadline(agreement_id)
```

The function:

1. verifies that the caller is the payer
2. verifies that the deadline has passed
3. verifies that escrow is still funded
4. marks the agreement as expired
5. refunds the escrow

The intended resulting state is:

```text
status = EXPIRED
escrow_status = REFUNDED
verification_result = EXPIRED
```

The deadline refund is intentionally **not** an automatic refund while the agreement is still undergoing verification.

In particular, an agreement in:

```text
EVIDENCE_SUBMITTED
```

or:

```text
DISPUTED
```

is not treated as a simple "merchant never started" case.

The deadline refund is specifically designed for the case where the merchant failed to submit evidence.

---

# Order Cancellation

A customer can cancel an agreement before escrow funding.

The current contract function is:

```text
cancel_by_payer(agreement_id)
```

The cancellation is restricted to the payer and requires the agreement to still be:

```text
CREATED
```

with no funded escrow.

A successful cancellation results in:

```text
agreement.status = CANCELLED
agreement.escrow_status = UNFUNDED
```

At the application level, the corresponding order can also be marked:

```text
orders.status = CANCELLED
```

There is no refund during this operation because the agreement has not been funded.

---

# Technology Stack

## Frontend

- React
- Vite
- JavaScript
- React Router
- CSS
- Wagmi
- MetaMask / injected wallet provider

## Blockchain

- GenLayer
- GenLayer Intelligent Contracts
- GenLayer JavaScript client
- Native GEN
- GenLayer Studionet during development/testing

## Database

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

## Deployment

- Vercel

# Environment Variables

Create a local `.env` file for development.

Example:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ACCORD_CONTRACT_ADDRESS=your_contract_address
```

# Local Development

## Prerequisites

Install:

- Node.js
- npm
- Git
- MetaMask or another compatible injected wallet
- a Supabase project
- access to the appropriate GenLayer network

---

## Install Dependencies

Clone the repository:

```bash
git clone <your-repository-url>
cd accord
```

Install packages:

```bash
npm install
```

---
