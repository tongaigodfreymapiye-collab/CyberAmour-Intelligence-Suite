# CyberAmour Public-Records Investigation Scope

## Live public-source categories

The public-records investigation invokes Gemini 2.5 Flash with Google Search grounding through a Firebase callable function. It only reports sources returned by the provider and only uses grounded source URLs. Search coverage is non-exhaustive and may be limited by search indexing, source availability, paywalls, jurisdiction, spelling variations and provider quotas. The application does not search every site or private database.

Depending on investigator-selected scope, the investigation can cover:

- Official court, law-enforcement, regulator, sanctions, corporate, procurement and insolvency records.
- Credible public reporting about fraud, theft, embezzlement, bribery, financial misconduct, deceptive business dealings, fiduciary misconduct and abuse of office.
- Documented integrity/conduct matters, with evidence strength, dates, source identity confidence, procedural status and outcome.
- Public reporting and official legal/regulatory proceedings about non-consensual intimate-image publication or image-based abuse, if selected. This mode covers only non-graphic reporting and legal context; it must never locate, return, link to, reproduce, download or mirror the underlying image/video, thumbnail or leak-distribution page. A subject reported as a complainant/victim is not adverse evidence. If the subject role is unclear, the event must not raise the assessed risk band.
- Publicly disclosed marital-status facts, if selected and genuinely relevant to the stated purpose. Use only minimal factual context found in reputable public reporting, subject-voluntarily-disclosed sources or official public proceedings. No private relationship details, sexual-life inference, fidelity allegations or other family details. Marital-status facts are context only and never increase risk by themselves.
- Directly relevant public social-media posts, labelled as user-generated claims unless independently corroborated.

## Risk interpretation

CyberAmour does not calculate a general moral-character, personality, fidelity or “good/bad person” score. Instead it reports evidence-based conduct indicators relevant to the stated lawful purpose, differentiating allegations, investigations, charges, civil proceedings, judgments, convictions, acquittals, dismissed cases and regulator actions. Public claims and allegations are not proof of guilt. Reports must show contrary information/outcomes and encourage verification against original records. No automated employment, credit, insurance, housing or similar eligibility recommendation is generated.

A risk level must be `Insufficient evidence` when there are no validated source-linked findings relevant to the stated purpose, or where findings consist only of marital-status context or victim/complainant status. A lack of search results must never be described as proof that no record exists.

## Hardware and network vulnerability assessments

The enterprise risk assessment includes separate checklists and separate report tables for hardware/endpoint risks and network/infrastructure risks. The public CVE lookup uses the NIST NVD API and CISA KEV catalog. Returned CVEs are keyword candidates, not proof of applicability: confirm exact vendor, product, hardware revision, CPE, firmware/version range and vendor advisory. Network results and PCAP/IDS references are kept separate from hardware/endpoint observations.

## Deployment

The frontend runs on GitHub Pages, but `investigatePublicRecords` executes as a Firebase Cloud Function and requires the `GEMINI_API_KEY` secret. To deploy backend changes, from the repository root run:

```powershell
npx firebase-tools deploy --only functions --project gen-lang-client-0695458456
```

Review the deployment output and confirm that `investigatePublicRecords` is updated. The frontend-only GitHub Pages workflow does not automatically deploy Cloud Functions unless explicitly configured to do so.
