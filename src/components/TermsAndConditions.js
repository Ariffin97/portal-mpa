import React from 'react';

const TermsAndConditions = ({ setCurrentPage }) => {
  return (
    <div className="terms-conditions">
      <div className="terms-header">
        <h1>Terms and Conditions</h1>
        <p className="terms-subtitle">Malaysia Pickleball Association Tournament Portal</p>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Malaysia Pickleball Association (MPA) Tournament Portal, 
            you accept and agree to be bound by the terms and provisions of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily access the MPA Tournament Portal for personal, 
            non-commercial transitory viewing and tournament application purposes only. This license shall automatically terminate if you violate any of these restrictions and may be terminated by MPA at any time.
          </p>
          <p>Under this license you may not:</p>
          <ul>
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial)</li>
            <li>attempt to decompile or reverse engineer any software contained on the website</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Tournament Applications</h2>
          <p>
            <strong>3.1 Application Accuracy:</strong> Users must provide accurate, complete, and up-to-date information when submitting tournament applications. False or misleading information may result in application rejection or tournament disqualification.
          </p>
          <p>
            <strong>3.2 Application Review:</strong> All tournament applications are subject to review and approval by MPA. Approval is not guaranteed and is at the sole discretion of MPA.
          </p>
          <p>
            <strong>3.3 Venue Requirements:</strong> Tournament venues must be fully covered and hold valid government occupancy permits. Failure to meet venue requirements may result in application rejection.
          </p>
          <p>
            <strong>3.4 Event Guidelines:</strong> Tournament organizers must comply with MPA regulations, including but not limited to skill rating guidelines, scoring formats, and branding requirements.
          </p>
        </section>

        <section className="terms-section">
          <h2>4. Data Protection and Privacy</h2>
          <p>
            <strong>4.1 Data Collection:</strong> MPA collects personal data including but not limited to names, contact information, and event details for the purposes of tournament organization and administration.
          </p>
          <p>
            <strong>4.2 Data Usage:</strong> Personal data will be used solely for tournament-related communications, administration, and compliance with applicable regulations.
          </p>
          <p>
            <strong>4.3 Data Security:</strong> MPA implements appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction.
          </p>
          <p>
            <strong>4.4 Data Retention:</strong> Personal data will be retained only for as long as necessary to fulfill the stated purposes or as required by law.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Intellectual Property</h2>
          <p>
            All content, including but not limited to logos, text, graphics, images, and software, 
            is the property of Malaysia Pickleball Association and is protected by copyright and other intellectual property laws. 
            The MPA logo is provided to approved tournament organizers for official tournament use only.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall Malaysia Pickleball Association or its suppliers be liable for any damages 
            (including, without limitation, damages for loss of data or profit, or due to business interruption) 
            arising out of the use or inability to use the materials on the MPA Tournament Portal, 
            even if MPA or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Tournament Regulations</h2>
          <p>
            <strong>7.1 Skill Ratings:</strong> Tournament categories must follow MPA skill rating guidelines:
          </p>
          <ul>
            <li>Novice: 2.499 & below</li>
            <li>Intermediate: 2.999 & below</li>
            <li>Intermediate+: 3.499 & below</li>
            <li>Advanced: 3.999 & below</li>
            <li>Advanced+: 4.499 & below</li>
            <li>Elite: 4.5 & above</li>
          </ul>
          <p>
            <strong>7.2 Scoring Format:</strong> Tournaments must use traditional scoring up to 11 points or more. 
            Rally scoring (minimum 21 points) is acceptable for first round-robins only.
          </p>
          <p>
            <strong>7.3 Branding:</strong> Approved tournaments must display MPA endorsement logos on event banners and at the venue.
          </p>
        </section>

        <section className="terms-section">
          <h2>8. Prohibited Activities</h2>
          <p>Users are prohibited from:</p>
          <ul>
            <li>Submitting false or fraudulent tournament applications</li>
            <li>Using the portal for any unlawful purpose</li>
            <li>Attempting to gain unauthorized access to the system</li>
            <li>Interfering with the proper working of the portal</li>
            <li>Using automated systems to access the portal</li>
            <li>Violating any applicable local, state, national, or international law</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>9. Termination</h2>
          <p>
            MPA may terminate or suspend access to the portal immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach the Terms and Conditions.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by and construed in accordance with the laws of Malaysia. 
            Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the Malaysian courts.
          </p>
        </section>

        <section className="terms-section">
          <h2>11. Changes to Terms</h2>
          <p>
            MPA reserves the right, at its sole discretion, to modify or replace these Terms and Conditions at any time. 
            If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section className="terms-section">
          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <div className="contact-details">
            <p><strong>Malaysia Pickleball Association</strong></p>
            <p>Email: info@malaysiapickleball.my</p>
            <p>Phone: +6011-16197471</p>
          </div>
        </section>
      </div>

      <div className="terms-footer">
        <button 
          className="back-home-btn" 
          onClick={() => setCurrentPage('home')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default TermsAndConditions;