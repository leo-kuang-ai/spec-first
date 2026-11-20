---
doc_role: securities-domain-reference
artifact_kind: prd-template-appendix
status: active
created: 2026-05-30
author: leokuang
note: |
  This appendix serves as an optional product-bundled overlay for incremental requirements in the securities/brokerage industry, loaded on-demand by the Template Trigger Map.
  Among which, the enumeration, settlement cycles, regulatory jurisdiction rules, and other items are all **typical examples commonly used in the industry**, and may vary by place of operation, license, or market.
  When writing the specific PRD, actual definition must be confirmed by the project source or the current executing dialog user; direct implementation without confirmation is not allowed.
---

# Securities industry attention points and reference appendix

> Usage: Loads only when input, project source, or the currently executing dialog user explicitly provides a securities/trading industry context. First, refer to the «Section One: Industry Cross-Vertical Mandatory Check List» to individually determine applicability; for applicable items, expand them in `00-generic.md` or in the corresponding surface template's conditional section.
>
> **Important**: All specific rules (settlement cycles, trading hours, regulatory requirements, tax obligations) in this appendix are for **example purposes only** and may vary based on market conditions, location of operation, and license type. Evidence source must be annotated when writing PRD (`confirmed-source` / compliance confirmation / `external-research` / `assumption`). Uncertain cases should be marked as Outstanding Questions.
>
> **Q&A Boundary**: Any questions requiring human supplementation or ruling shall only be directed to the current dialogue's user. Compliance/legal documentation and co-signature records are source evidence, not a second human Q&A routing.

---

## 1. Required cross-cutting checks

When writing broker requirements, judge item by item whether it applies / how it affects this requirement. The applicable items must be clearly stated in the PRD; non-applicable items should explicitly mark "not involved".

| # | Focus point | The questions that must be answered | Typical involvement of surface |
| --- | --- | --- | --- |
| C1 | **Regulation and Compliance** | Which regulatory jurisdiction/operating territory/license holder is involved? Is compliance review required? Are risk disclosures, disclaimer, investor education, or marketing content reviews required? | All |
| C2 | **Investor Suitability** | Does it involve customer classification, risk tolerance, product risk level, access validation, assessment expiration, and risk disclosure confirmation? | App, Admin, Backend |
| C3 | **AML and KYC** | Does it involve identity verification, customer risk assessment (CRA), enhanced due diligence (EDD), sanctions/blacklist screening, expired documents, and beneficial ownership? | Admin, Backend |
| C4 | **Risk Control** | Does it involve position limits, concentration, margin/capital purchasing power, risk exposure, stop-loss, purchase restrictions, cooling-off periods, or abnormal trading? Trigger conditions and response actions? | Backend, App, Admin |
| C5 | **Market Data** | Market data permissions (Level 1/Level 2, real-time/delayed)? Market data source/supplier? How to display trading hours, suspension, circuit breakers, and no permissions? | App, Backend |
| C6 | **Trades and Orders** | Which markets/security types? Order types, validity period, trading hours, cancellation/revision, conditional orders, and multi-market rule differences? | App, Backend |
| C7 | **Funds and Settlement** | Multi-currency? Deposit/withdrawal? Purchasing power, freeze/thaw, fees, settlement cycle (T+N), billing, reconciliation? | Backend, Admin, App |
| C8 | **Multiple Business Locations/Multiple Licenses** | Rule differences across different operating locations (e.g., VBrokers, Tickrs, M+Global, etc.)? How are default rules and regional variations isolated? | All |
| C9 | **Audit and Traceability** | Yes, the following requirements involve: operational traceability, transaction record retention period, risk confirmation, suitability confirmation, dual recording (dual recording), and electronic contract notarization. | Admin, Backend, App |
| C10 | **Data Accuracy and Time Zones** | Price precision, minimum tick size, up-down price limits, currency format, and exchange time zone vs. user's local time zone: how are they displayed and converted? | App, Backend |
| C11 | **Content and Advisor Boundary** | Does it involve information, investor education, marketing, strategy, individual stock recommendations, disclaimer, suitability warnings, or content publication review? | App, Admin |
| C12 | **Customer Complaints and Exception Handling** | What to do after a user fails to complete a transaction? Who handles fund/order anomalies? Is compensation required? Is manual review needed? What are the customer service guidelines and SOPs? | Admin, Backend, App |
| C13 | **Corporate Actions** | Does it involve dividend distributions, stock splits/mergers, rights issues/share offerings, mergers & acquisitions, delisting, stock code changes, or ADR ratio adjustments? How do these affect holding quantity, cost basis, available balance, tradability, and user notifications? | Backend, App, Admin |
| C14 | **Expenses, Taxes, and Cost Disclosures** | What fees are involved (commissions, platform fees, regulatory fees, exchange rate spreads, financing interest)? How are taxes handled (dividend withholding tax, stamp duty, capital gains, W-8BEN)? Is prior disclosure and post-trade documentation required? | App, Backend, H5/PC |
| C15 | **Notification Delivery and Timeliness** | Delivery channels, time requirements, retry mechanisms, and audit trails for margin calls (margin call notifications), trade confirmations, forced liquidation warnings, company actions, and abnormal situation handling? Are there regulatory obligations regarding delivery? | Backend, App, Admin |
| C16 | **System Availability and Business Continuity** | Availability objectives during trading hours, circuit breaking/grading strategies, incident announcement guidelines, disaster recovery switching, data integrity and non-loss? Does this meet the requirements for critical information infrastructure and emergency response? | Backend, Mixed |
| C17 | **Cross-border Data and Personal Information Protection** | Multiple data storage locations, cross-border data transmission, data subject rights (query, correction, deletion, withdrawal of consent), and consent management – which regulatory framework applies: PIPL (China), Hong Kong PDPO, GDPR, or Singapore PDPA? | All |
| C18 | Suspicious Transaction Reporting and Regulatory Submission | Whether suspicious transaction reports (STR), large-value transaction reports, position/trading regulatory submissions, and internal risk control alerts are triggered? Conditions for triggering, reporting criteria, time limits, and record-keeping requirements? | Backend, Admin |
| C19 | **Simulated Desk / Virtual Trading Boundary** | Does it involve simulation accounts, virtual funds, or demo accounts? How are simulated data and real funds/trading conditions/order execution isolated? Are there anti-misleading labels to prevent confusion with actual trading? | App, Backend |
| C20 | **Account Security and Anti-Fraud** | Does it involve login security, anomaly login detection, session security, device binding/changes, two-factor authentication (OTP/biometric), and additional verification for sensitive operations (password change, phone number update, large withdrawals)? How is account takeover (ATO) handled—frozen, appealed, and restored? (Distinguished from C3 identity verification and C4 transaction risk control) | App, Backend, Admin |

> C13–C20 are high-frequency gaps supplemented on the C1–C12 main line. When writing requirements, evaluate each item individually as "applicable"/"not involved"; applicable items expand the corresponding surface's conditional section.

---

## 2. Securities PRD metadata

It is recommended that all securities industry PRDs include the following metadata at the beginning, to facilitate correct lens selection by `spec-prd` and `spec-plan`.

| Item | content |
| --- | --- |
| Place of operation / Regulatory jurisdiction | |
| License holder / Business entity | |
| Target market | HK stocks / US stocks / A-shares / Funds / Options / Bonds / Others |
| Securities / Product Type | |
| Customer Type | Retail investors / Professional investors / Institutions / Unaccounted users / Internal roles |
| Account type | Cash / Margin / Comprehensive Account / Demo Account / Not involved |
| Whether it involves funds or trading | Yes / No |
| Does it involve personal information or sensitive data? | Yes / No |
| Do you need compliance/risk control confirmation? | Yes / No / Pending confirmation |
| Rule evidence source | Compliance opinion / Operating rules / Exchange rules / Third-party agreements / Source code documentation / assumption |

---

## 3. Example values to confirm for each market and jurisdiction

> The following are common industry values, **not facts**. When writing a PRD, confirm the actual support scope based on the target market and place of operation; for unsupported features, clearly mark "Not supported this period".

### Order type (example)

| Type | Meaning | PRD needs to be clearly written |
| --- | --- | --- |
| Market order | Execute immediately at the current best price | Whether allowed, applicable period, price protection/failure prompt |
| Limit Order | Fill at specified price or better | Price precision, minimum tick size, and overprice handling |
| Stop Order | After trigger price is reached, switch to market order | Trigger conditions, user perception after trigger |
| Stop-Limit Order | After trigger price is reached, switch to limit order | Relationship between trigger price and limit price |
| Conditional Order | Place an order upon meeting the conditions | Validity period, failure trigger, cancellation rules |

### Order validity period (example)

Valid for the day / Good till cancelled (GTC) / Immediate or cancel (IOC) / Fill or kill (FOK).

PRD must clearly specify: the validity periods supported, default values, market-specific differences, status after expiration, and user prompts.

### Trading hours (example, by market)

| market | Period (example, to be confirmed) | PRD focus points |
| --- | --- | --- |
| Hong Kong stocks | Pre-market bidding, morning session, afternoon session, closing bidding; some brokerage firms support dark pool trading | Does the dark pool support? How to display the closing auction? |
| US stocks | Pre-market, in-market, post-market (based on broker support) | Pre- and post-market order type restrictions, time zones |
| A-shares | Collective bidding, morning session, afternoon session | Up-down limit, minimum unit, trading calendar |

### Account type (example)

Cash Account / Margin Account / Integrated Account / Simulation Account

### Account status (example)

Pending account opening / Under review / Already activated / Transaction restricted / Frozen / Dormant / Closed.

### Customer segmentation (example: by region)

Professional investors / retail investors; different categories correspond to different suitability, risk disclosure, and product access rules.

### Funds status (example)

To be booked / Booked / To be reviewed / Frozen / Thawed / Fund withdrawal in progress / Fund withdrawal failed / Returned.

### Settlement cycle (example, must confirm)

The settlement cycles (e.g., T+N) for Hong Kong stocks, U.S. stocks, A-shares, and other markets may vary according to market rules and regulatory adjustments; **the PRD must not lock in fixed values, and should instead reflect the official settlement terms confirmed by compliance or operations for the current period**.

---

## 4. Business domain checklist

### Account Opening / KYC / Document Update

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Identity information | Product meaning of the collection field, required or not, sensitive or not, display / de-identification |
| Document validity period | Expiry reminder, expiry restriction, recovery method |
| CRA / EDD | Trigger condition, handling node, manual review, user prompt |
| Sanctions/Blacklist | What do users/operations see after a hit? Is the function frozen? |
| Data change | Whether to re-approve, whether it affects transactions/funds transfer |

### Suitability / Product Admission

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Customer segmentation | Applicable customers, hidden, disabled, or subject to confirmation |
| Product risk level | Product and customer tolerance matching rules |
| Evaluation expired | Reminders, restrictions, and re-evaluation entry point |
| Risk Disclosure | Display timing, confirmation action, traceability |
| Not through result | Intercept/Notify/Manual Handling/Allow Continue Confirmation |

### Market / Search / News

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Market rights permission | Real-time / Delayed / No permission display |
| Market data source | Supplier/Rule Source; marked as assumption if not confirmed |
| Refresh mechanism | Real-time/periodic/manual refresh of product perception |
| Suspension / Circuit Breaker | Display, actionable items, hints |
| Content boundaries | Do investment education, information, advisory, and marketing contents require review and disclaimer? |

### Trade / Order / Position

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Pre-ordering prerequisites | Login, Account Opening, Trading Permissions, Suitability, Risk Control |
| Price/Quantity | Accuracy, Unit, Minimum Price Tick, Upper and Lower Limits |
| State transition | Submitting, delegated, partial settlement, full settlement, cancelled, failed |
| Exception Handling | Timeout, duplicate submission, status conflict, partial success |
| Cancel/Modify Order | Display conditions, clickable conditions, result copy |

### Funds / Clearing and Settlement / Reconciliation

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Financial impact | Available, retrievable, purchasing power, frozen, unfrozen, transaction fee |
| Currency/Exchange rate | Display currency, conversion basis, and pending confirmation items |
| Inbound and outbound funds | Review, failure, return, settlement timing |
| Settlement | T+N caliber, availability/availability changes, market differences |
| Reconciliation | Reconciliation failure, discrepancy handling, manual compensation, user perception |

### Corporate Actions

> Highly prone to being overlooked, and directly alters positions and funds. Must be reviewed when involving dividends, stock splits, rights issues, mergers & acquisitions, delistings, or changes in stock code/ratio.

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Action type | Cash dividend / Stock dividend / Stock split / Consolidation / Rights issue / Bonus issue / Mergers & acquisitions / Delisting / Stock code change / ADR ratio adjustment |
| Impact on positions held | Quantity changes, cost price adjustments, available/frozen quantities, broken shares handling rules |
| Impact on funds | Dividend crediting timing, withholding tax, fees, currency, and settlement methodology |
| Tradability | Trading halt period, rights/dividend payment date, registration date, able to place/cancel order |
| User selection rights | Entry point for user to select an action (e.g., cash or stock), deadline, default handling |
| Notice | Notification channel, timing, content, whether confirmation is required (in alignment with C15) |
| Display | How to annotate prices/percentage changes before and after rights adjustment, historical cost, and position details? |

### Expenses, Taxes, and Cost Disclosures

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Cost type | Commission, platform fees, exchange/regulatory fees, settlement fees, financing interest, exchange rate points, minimum charge |
| Calculation Scope | Per-transaction / per-quantity / per-ratio, ceiling / floor, currency, precision, rounding rule |
| Pre-disclosure | Whether to display estimated fees/taxes before ordering; itemized or total? |
| Taxes and fees | Dividend withholding tax, stamp duty, capital gains, cross-border tax (e.g., W-8BEN); withholding and deduction basis |
| Post-transaction voucher | Expense details, transaction order, invoice, export and save criteria |
| Business operation location differences | Differential fees and tariff variations across markets/licensing categories (variations by operational territory) |

---

## 4b. Data Retention Period Matrix (Template)

> The retention periods for various records are scattered and prone to errors; use this table to centralize them. **Retention period, exportability, and destruction criteria must all be confirmed by compliance for the applicable period**, marked with the evidence tag in the PRD; unconfirmed items remain in Outstanding Questions.

| Record type | Data sensitivity level | Retention period (compliance confirmation) | Queryable role | Can it be exported? | Expiration handling (archiving/obscuring/destroys) | Evidence tag |
| --- | --- | --- | --- | --- | --- | --- |
| Customer Identity Verification (KYC) | Sensitive personal information | | | | | |
| Suitability / Risk Tolerance Assessment Record | Compliance records | | | | | |
| Trade / Order / Transaction Record | Transaction record | | | | | |
| Funds flow / Inbound and outbound records | Funds record | | | | | |
| Dual recording / Electronic contract / Evidence preservation | Compliance records | | | | | |
| Operation / Audit Log | Audit log | | | | | |
| Risk Control / AML Response and Reporting Records | Compliance records | | | | | |
| Notice / Delivery Record | Audit log | | | | | |

---

## 4c. Operations and compliance checklist (C15–C20)

### Notification Delivery and Timeliness (C15)

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Notification type | Premium Notice / Trade Confirmation / Forced Liquidation Alert / Company Action / Fund Arrival / Risk Control Response / System Announcement |
| Delivery channels | Intranet messages / push notifications / SMS / email / phone calls; multi-channel redundancy? |
| Time requirement | Real-time / minute-level / T+N; Are there regulatory delivery obligations and time limits? |
| Failure Handling | Delivery failure retry, downgrade channel, whether to block critical actions |
| Traceable | Whether to record delivery status, time, channel, and content (aligning with the retention matrix) |

### System Availability and Business Continuity (C16)

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Availability objectives | Availability metric during trading hours; key links (order placement/cancellation/funding) acceptable downtime |
| Degradation strategy | Hide entry when third-party/counter/quote unavailable / Queue / Read-only / Manual handling |
| Fault Announcement | User-visible error messages, incident announcements, and recovery notifications |
| Disaster recovery / Data | Will data be lost after the switch? Will there be data duplication? Does the user need to retry? |
| Emergency response | Whether it involves critical information infrastructure and regulatory emergency reporting requirements |

### Cross-border Data and Personal Information Protection (C17)

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Applicable regulations | PIPL / Hong Kong PDPO / GDPR / Singapore PDPA (based on place of operation) |
| Data storage location | Which jurisdiction does the data fall under, and is cross-border transmission permitted? |
| Cross-border transmission | Transmission purpose, minimum necessary, whether separate consent or security assessment required |
| Data subject rights | Query / Correct / Delete / Withdraw / Reject entry and time limit |
| Agreement Management | Agree to data collection timing, revocability, and traceability |

### Suspicious Transaction Reporting and Regulatory Submission (C18)

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Trigger condition | Identification criteria for suspicious transactions (STR), large-value transactions, and abnormal behaviors |
| Report action | Reporting recipient, scope, deadline, responsible/officer for review, whether manual confirmation required |
| Regulatory Reports | Position/Trading/Funds Supervision Reporting: Output, Frequency, Responsible Roles |
| Confidentiality Requirements | Reporting must not involve tipping off customers or similar constraints |
| Traceable | Report record retention (aligns with retention matrix) |

### Simulated Desk / Virtual Trading Boundary (C19)

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Isolation | Simulated funds/trading positions/orders are completely isolated from the real account, with no impact on each other. |
| Data source | Simulated market data: real-time/delayed/simulated; consistent with real market data |
| Anti-deception | Clear "simulated" labeling throughout; ensure users do not mistakenly believe actual trades or profit/loss have occurred. |
| Transformation | Whether the guidance from simulation to reality is compliant, appropriate, and includes adequate risk disclosure |
| Traceable | Does simulation operation require logging? Is it included in any real statistical analysis? |

### Account Security and Anti-Fraud (C20)

> Differing from C3 (identity verification/AML) and C4 (transaction risk control): C20 focuses on **who is using the account, whether it is the account holder, and whether it has been compromised**. The securities app is a high-value target for attacks; login, session, and security verification for sensitive operations are product-level requirements. Rules perceivable to product and risk control, and user-perceivable; do not describe risk control engine or encryption algorithm implementations.

| Inspection item | PRD must be clearly specified |
| --- | --- |
| Login Security | Login methods, account lockout on failure, anomaly detection (remote location/device/IP change) and response measures |
| Session Security | Session timeout, concurrent login, kick offline, public device exit |
| Devices and Binding | Device binding/unbinding, device replacement verification, trusted device management |
| Secondary verification | Which sensitive operations (password change, phone/email binding change, large withdrawals, recipient account modification) require OTP/biometric/face verification? Verification failure results |
| Account takeover (ATO) | How to freeze, notify, appeal, and restore a suspected case of unauthorized use; actions allowed/forbidden during restoration period |
| Anti-fraud boundary | Division of responsibilities with AML (C3) and transaction risk control (C4), without overlap or omission |
| Traceable | Login, sensitive operations, freeze/thaw, appeal logging (aligning with retention matrix) |

Do not simply write "added CAPTCHA". Must specify: which operation, when it triggers, verification method, results on failure and timeout, whether it can be bypassed, and who can review the audit trail. Account security events often also involve C16 availability and C9/C15 notification logging.

---

## 5. Differences by jurisdiction

> Do not scatter the differences by business location throughout the main text; use this table to describe them uniformly.

| Difference items | Default rules | Place of operation A | Business location B | Influence module |
| --- | --- | --- | --- | --- |
| Currency | | | | Amount display, settlement |
| Time zone | | | | Trading hours, statistical criteria |
| Tradable Market | | | | Market data, order placement |
| Suitability/Client Classification Rules | | | | Access control, risk disclosure |
| Compliance restrictions | | | | User onboarding, risk control |
| Taxes (such as U.S. stock W-8BEN) | | | | Account opening, withdrawal of funds |
| Fee / Cost Rules | | | | Place order, billing, cost visibility |
| Data storage location / Cross-border transmission | | | | Data compliance, privacy |
| Data saving/export | | | | Audit, Reports |

---

## 6. Brokerage glossary

| Terminology | Explanation |
| --- | --- |
| KYC | Customer Due Diligence (KYC) |
| CRA | Customer Risk Assessment |
| EDD | Strengthened Due Diligence (EDD) |
| Appropriateness | Investor risk tolerance and product risk level matching management |
| Purchasing power | Funds/Quota available for trading |
| Margin / Maintenance Margin | Collateral Account: Collateral and Maintenance Requirements |
| Forcing liquidation | Forced liquidation upon risk level exceeding threshold |
| Market rights permission | Level 1/Level 2, real-time/delayed market data access tiers |
| Suspension / Circuit Breaker | Trading suspension mechanism |
| Place of business operation | Brokerage operation licenses / regional entities (e.g., VBrokers/Tickrs/M+Global) |
| Audio-visual recording | Sales process audio and video recording as required by regulatory requirements |
| Four-eye review | A control mechanism where processing and reconciliation are carried out by different roles/persons |
| Maker-Checker | A processing-review mechanism similar to the "Four-Eyes Review" |
| Corporate Action | Dividends, stock splits, rights issues, mergers & acquisitions, delistings, and other securities issuer actions that affect holdings and capital |
| Margin call | A notice to customers requiring additional margin due to insufficient margin usually has specific delivery time requirements. |
| Rights suspension / Dividend suspension | Price adjustments due to company actions and position cost revisions |
| Pre-withholding tax / Withholding Tax | Dividends and other income are subject to advance tax withholding at the time of distribution. |
| STR | Suspicious Transaction Report |
| Tipping-off | Leak to the investigated client its being reported/being investigated status, typically prohibited by regulators |
| BCP / DR | Business Continuity Plan / Disaster Recovery |
| ATO | Account takeover: unauthorized use of another user's account |
| OTP | One-time password (OTP) used for two-step verification during sensitive operations |
| 2FA / MFA | Two-factor / Multi-factor authentication |
| Trusted Device | Devices bound or verified, allowing subsequent bypass of additional validation checks |

---

## 7. Regulations and standards (research leads, not confirmed requirements)

> The following are commonly used regulatory and standard references when drafting PRDs for the securities industry. When referencing in PRD, the date, applicable jurisdiction, applicable entity, and evidence tag must be annotated; specific definitions shall follow compliance confirmation and the latest original text.

| Reference | Applicable leads | PRD focus points |
| --- | --- | --- |
| The Securities and Futures Investors Appropriateness Management Measures (CSRC Order No. 130) | Investor classification, product or service risk matching, suitability obligations | Customer segmentation, evaluation, access control, risk disclosure, and confirmation tracing |
| Management Measures for Network and Information Security in the Securities and Futures Industry (CSRC Order No. 218) | Network and information security, investor personal information protection, emergency response, and critical information infrastructure | Personal information, system availability, security incidents, data protection, operational audit trails |
| Management Measures for Customer Due Diligence, Customer Identity Data, and Transaction Record Retention by Financial Institutions (PBOC, CBIRC, and CSRC Order No. 11, 2025) | Customer Due Diligence, Customer Identity Documentation and Transaction Record Retention, Traceability | KYC, AML, document retention, transaction records, authorization inquiry |
| "Guidelines for Data Security Management and Protection in the Securities and Futures Industry" and other industry standards | Data security management and protection, industry data governance | Data classification and grading, export, de-identification, storage, access permissions |

These references can only assist PRD authors in identifying issues; they do not automatically generate product conclusions. For example, "how long are transaction records retained," "can a particular client trade a specific product," and "what is the settlement cycle in a particular market" must all be determined according to the operating location, license holder, exchange/settlement rules, and compliance approval.

---

## 8. Specify product behavior, not implementation

Brokerage requirements easily lead to technical/cash desk implementations being written into PRD. Guard the boundaries:

| Write (product/compliance constraints) | No writing (left for `spec-plan` / counter / interface documentation) |
| --- | --- |
| «Before placing an order, perform appropriate suitability verification; if failed, intercept and prompt» | Appropriateness service interface, rule engine implementation |
| Orders in this market will be settled according to the settlement cycle of the period when the trade is executed. | Clearing system integration, accounting journal entries |
| Display delayed market data and annotate when market data permission is unavailable | Market Data Gateway Protocol, datatype encoding |
| "Risk level exceeds threshold to trigger strong liquidation reminder" | Strong-liquidation engine algorithm and margin calculation formula implementation |
| Funds withdrawal requires compliance/risk control review | Audit workflow engine and status table design |
| Exporting customer data requires authorization, sensitivity masking, and audit trail recording | Export task table structure, file storage implementation |
