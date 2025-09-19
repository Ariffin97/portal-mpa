import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import OrganizationRegistration from './components/OrganizationRegistration';
import OrganizationLoginModal from './components/OrganizationLoginModal';
import OrganizationTermsAndConditions from './components/OrganizationTermsAndConditions';
import OrganizationPrivacyPolicy from './components/OrganizationPrivacyPolicy';
import TournamentApplication from './components/TournamentApplication';
import ApplicationStatus from './components/ApplicationStatus';
import TermsAndConditions from './components/TermsAndConditions';
import AssessmentSystem from './components/AssessmentSystem';
import mpaLogo from './assets/images/mpa.png';
import ref1Image from './assets/images/ref1.png';
import safeSportCodePDF from './assets/documents/safesportcode.pdf';
import { useNotices } from './contexts/NoticeContext';
import apiService from './services/api';

function App() {
  // Use shared notices context
  const { getActiveNotices } = useNotices();
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTournamentGuidelines, setShowTournamentGuidelines] = useState(false);
  const [isNoticePortalExpanded, setIsNoticePortalExpanded] = useState(false);
  const [showImportantNotice, setShowImportantNotice] = useState(false);
  const [showApplyDropdown, setShowApplyDropdown] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Global assessment submissions state
  const [globalAssessmentSubmissions, setGlobalAssessmentSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem('assessmentSubmissions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading assessment submissions:', error);
      return [];
    }
  });

  // Function to save assessment submissions
  const saveAssessmentSubmission = (submission) => {
    const newSubmission = {
      ...submission,
      id: Date.now() + Math.random(), // Ensure unique ID
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const updatedSubmissions = [...globalAssessmentSubmissions, newSubmission];
    setGlobalAssessmentSubmissions(updatedSubmissions);

    // Save to localStorage
    try {
      localStorage.setItem('assessmentSubmissions', JSON.stringify(updatedSubmissions));
    } catch (error) {
      console.error('Error saving assessment submission:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showApplyDropdown && !event.target.closest('.apply-dropdown-container')) {
        setShowApplyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showApplyDropdown]);

  // Toggle dropdown - always appears at the top
  const handleDropdownToggle = () => {
    setShowApplyDropdown(!showApplyDropdown);
  };

  // Check login status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const loginStatus = localStorage.getItem('isLoggedIn');
      const username = localStorage.getItem('username');
      const loginTimestamp = localStorage.getItem('loginTimestamp');

      if (loginStatus === 'true' && username && loginTimestamp) {
        // Check if session has expired (24 hours = 24 * 60 * 60 * 1000 ms)
        const sessionDuration = 24 * 60 * 60 * 1000;
        const currentTime = Date.now();
        const timeSinceLogin = currentTime - parseInt(loginTimestamp);

        if (timeSinceLogin > sessionDuration) {
          console.log('Session expired due to time limit, clearing auth');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userAuthority');
          localStorage.removeItem('username');
          localStorage.removeItem('loginTimestamp');
          setIsLoggedIn(false);
          return;
        }

        // Verify session is still valid with server
        try {
          await apiService.healthCheck();
          setIsLoggedIn(true);
        } catch (error) {
          console.log('Session expired or server unavailable, clearing auth');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userAuthority');
          localStorage.removeItem('username');
          localStorage.removeItem('loginTimestamp');
          setIsLoggedIn(false);
        }
      }
    };

    checkAuthStatus();
  }, []);

  // Tournament Guidelines Component
  const renderTournamentGuidelines = () => (
    <div className="tournament-guidelines-modal">
      <div className="modal-overlay" onClick={() => setShowTournamentGuidelines(false)}>
        <div className="modal-content tournament-guidelines-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Tournament Guidelines for Organisers</h2>
            <button className="modal-close-btn" onClick={() => setShowTournamentGuidelines(false)}>
              ×
            </button>
          </div>
          
          <div className="modal-body tournament-guidelines-body">
            <div className="guidelines-section">
              <h3>Tournament Banners/Social Media Notices</h3>
              <p className="guidelines-note">(kindly refer to figure 1)</p>
              <ul>
                <li>All promotional materials (banners, social media posts, flyers, etc.) must prominently display the organizer's name and MPA/State Pickleball logo(s).</li>
                <li>Include the phrase "Supported by" above the MPA/State logos to acknowledge the endorsement.</li>
                <li>Ensure the logos are high-resolution and appropriately sized for visibility.</li>
                <li>Include essential tournament details such as date, location, registration deadlines, and contact information.</li>
              </ul>
              <div className="reference-image">
                <img src={ref1Image} alt="Figure 1: Tournament Banner/Poster Guidelines Example" className="guidelines-ref-image" />
                <p className="image-caption"><strong>Figure 1:</strong> Example of proper tournament banner/poster layout with MPA logo placement</p>
              </div>
            </div>

            <div className="guidelines-section">
              <h3>Tournament Director</h3>
              <ul>
                <li>A Tournament Director (TD) must be appointed to oversee all aspects of the event. The TD is responsible for ensuring compliance with USA Pickleball rules, managing staff, resolving disputes, and ensuring the smooth operation of the tournament.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>USA Pickleball Rulebook 2025</h3>
              <ul>
                <li>The tournament must adhere to the USA Pickleball Rulebook 2025. All referees, players, and staff must know the latest rules and updates.</li>
                <li>Stand by a printed USA Pickleball Rulebook on the referee table.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Tournament Code of Conduct</h3>
              <ul>
                <li>Provide all players with a copy of the Tournament Code of Conduct prior to the event.</li>
                <li>Ensure the Code of Conduct is prominently displayed at the venue in multiple locations (e.g., registration desk, player lounges, and spectator areas).</li>
                <li>The Code of Conduct should outline expectations for sportsmanship, behaviours, and consequences for violations.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Consent to Indemnify Form</h3>
              <ul>
                <li>All players must complete and sign a Consent to Indemnify Form before participating.</li>
                <li>This form should include clauses regarding liability, injury waivers, and acknowledgment of tournament rules.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Venue Requirements</h3>
              <ul>
                <li>Ensure the venue is safe, well-maintained, and compliant with local regulations.</li>
                <li>Provide players and spectators with adequate seating, hydration stations, and first aid facilities.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Verbal Warnings, Technical Warnings, Technical Fouls, Ejections and Expulsions</h3>
              <h4>Referee and Tournament Director Responsibilities</h4>
              <ul>
                <li>Referees and the Tournament Director must be thoroughly trained in issuing verbal warnings, technical warnings, and technical fouls, ejections, and expulsion as outlined in Section 13G and 13M of the USA Pickleball Rulebook 2025.</li>
                <li>Ensure the tournament director and referees maintain professionalism and consistency when addressing rule violations.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Dispute Resolution</h3>
              <ul>
                <li>Establish a clear process for resolving disputes, including appeals to the Tournament Director.</li>
                <li>Ensure all decisions are documented and communicated to the involved parties.</li>
              </ul>
            </div>

            <div className="guidelines-section">
              <h3>Safe Sport Code</h3>
              <p>The Safe Sport Code is a set of guidelines developed by the Ministry of Youth and Sports (KBS) to guide the creation of a safe sports environment with clear guidelines that define the jurisdiction of all parties in addressing disruptions and abuse in sports. The organizer is required to read and adhere to the code. A copy of the Safe Sport Code is to be provided to the participant.</p>
            </div>

            <div className="guidelines-section">
              <h3>Additional Recommendations</h3>
              
              <h4>Player Communication</h4>
              <p>Send a pre-tournament notification/email/meeting to all registered players/team managers, including the Code of Conduct, Consent to Indemnify Form, and a summary of key rules (Information/Fact Sheet).</p>
              
              <h4>Referee Training</h4>
              <p>Conduct a pre-tournament briefing for referees to review rules, protocols, and expectations.</p>
              
              <h4>Spectator Engagement</h4>
              <p>Encourage spectators to follow the Code of Conduct and respect players and officials.</p>
              
              <h4>Post-Tournament Feedback</h4>
              <p>Collect feedback from players, referees, and staff to improve future events.</p>
            </div>

            <div className="guidelines-section important">
              <h3>Registration Fee Advisory</h3>
              <p>In the interest of promoting inclusivity and accessibility in the sport of pickleball, the Malaysia Pickleball Association (MPA) strongly advises all tournament organisers to cap participant registration fees at a maximum of <strong>RM200 per person</strong>. This recommendation aims to ensure wider participation from various community segments while maintaining affordability across all levels of competition. Any exception to this advisory must be submitted in writing and approved by MPA before the commencement of registration.</p>
            </div>

            <div className="guidelines-section">
              <h3>Rally Scoring Format</h3>
              <p>For matches utilizing the rally scoring format, all matches shall be played to <strong>21 points</strong>.</p>
            </div>

            <div className="guidelines-section">
              <h3>Figure 1. Banner/Poster Guidelines</h3>
              <div className="banner-guidelines">
                <h4>Draft Template</h4>
                <div className="template-section">
                  <h2>PICKLEBALL TOURNAMENT CODE OF CONDUCT</h2>
                  <p><em>[Tournament Name]</em></p>
                  
                  <h4>1. POLICY STATEMENT</h4>
                  <p>The Tournament Organiser and its members are committed to fostering a respectful, safe, and inclusive environment for all participants, guests, and staff during the [Tournament Name] and related events. This Code of Conduct outlines the expectations for behavior and the consequences of violations.</p>
                  
                  <h4>2. CONTEXT AND BACKGROUND</h4>
                  <p>The [Organiser] is dedicated to maintaining a positive and welcoming atmosphere at all tournaments and championships. This includes promoting appropriate behavior, addressing misconduct, and ensuring the safety and enjoyment of all participants.</p>
                  
                  <h4>3. APPLICATION</h4>
                  <p>This Code of Conduct applies to:</p>
                  <ul>
                    <li>All individuals participating in [Tournament Name] programs, activities, and events.</li>
                    <li>Guests and visitors entering the [Organiser's] facility, regardless of whether they are players.</li>
                  </ul>
                  
                  <h4>4. EXPECTATIONS FOR ALL PARTICIPANTS</h4>
                  
                  <h5>4.1 Respect</h5>
                  <p>All participants are expected to treat others with respect and dignity. This includes, but is not limited to:</p>
                  
                  <h6>Respect for Individuals</h6>
                  <p>Treat fellow players, guests, visitors, and staff with courtesy and respect, regardless of physical characteristics, athletic ability, age, ancestry, colour, race, citizenship, ethnic origin, creed, disability, family status, economic or marital status, gender identity or expression, or sexual orientation.</p>
                  
                  <h6>Appropriate Attire</h6>
                  <p>Wear safe and appropriate clothing. Avoid attire with offensive logos, designs, or language.</p>
                  
                  <h6>Prohibition of Harassment</h6>
                  <p>Harassment of any kind—verbal, physical, or emotional—is strictly prohibited.</p>
                  
                  <h6>Language and Behaviour</h6>
                  <p>Avoid the use of profanity, inappropriate language, bullying, or intimidation.</p>
                  
                  <h6>Sportsmanship</h6>
                  <p>Demonstrate ethical conduct, sportsmanship, and leadership at all times. Acknowledge great plays and positively promote the sport.</p>
                  
                  <h6>Court Etiquette</h6>
                  <ul>
                    <li>Clearly announce the score before serving to avoid disputes.</li>
                    <li>Acknowledge opponents at the net after each game and promptly exit the court to keep the schedule on track.</li>
                    <li><strong>Line Calls:</strong> Make fair and accurate line calls. If in doubt, call the ball "in."</li>
                    <li>Avoid giving unsolicited advice or instruction during gameplay.</li>
                    <li>All players are expected to play to their best of their abilities, with sportsmanship, ethics and respect fellow players and official's decisions during the tournament.</li>
                    <li>No influence of alcohol or substances, smoking, vaping, or other misdemeanours deemed unacceptable by the Tournament Director or Umpire.</li>
                  </ul>
                  
                  <h5>4.2 Safety</h5>
                  
                  <h6>Warm-Up and Preparation</h6>
                  <p>Perform a proper warm-up before playing to reduce the risk of injury. Stretch before and after matches.</p>
                  
                  <h6>Physical Limits</h6>
                  <p>Be mindful of your physical condition and avoid over-exertion during play.</p>
                  
                  <h6>Court Safety</h6>
                  <p>If a ball from another court enters your court, immediately stop play by announcing "ball on court." Resume play only after the ball is returned.</p>
                  
                  <h5>4.3 Loyalty</h5>
                  
                  <h6>Public Conduct</h6>
                  <p>Refrain from making negative comments about the sport of Pickleball, the Organizer, or its partners on public forums (e.g., Facebook, Instagram, X). Address concerns directly with the Organizer's representatives.</p>
                  
                  <h6>Feedback</h6>
                  <p>Constructive feedback is encouraged. Members are welcome to share their thoughts and suggestions to help improve the tournament experience.</p>
                  
                  <h4>5. CONSEQUENCES FOR VIOLATIONS</h4>
                  <p>(Verbal Warning, Technical Warning, Technical Fouls)</p>
                  <p>Failure to adhere to this Code of Conduct may result in disciplinary action, including but not limited to:</p>
                  
                  <h6>First Offence</h6>
                  <p>A verbal warning or technical warning will be issued by the Tournament Director or Referee.</p>
                  
                  <h6>Second Offence</h6>
                  <p>A technical warning or technical foul will be issued by the Tournament Director or Referee. A single point will be deducted from the offender or team.</p>
                  
                  <h6>Game or Match Forfeit</h6>
                  <p>The referee can impose a game or match forfeit based on a combination of Technical Warnings or Technical Fouls.</p>
                  
                  <h6>Ejections and Expulsions</h6>
                  <p>The Tournament Director may eject a player from the tournament for flagrant and particularly injurious behavior that, in the director's opinion, impacts the tournament's success and integrity.</p>
                  
                  <h6>Immediate Ban</h6>
                  <p>Repeated violations may result in the offender or offending team being banned from the tournament and future tournaments organized by the organizer.</p>
                  
                  <h6>Investigation Fee</h6>
                  <p>If the offender requests further investigation, the organising committee must be paid a fee of [RMXXX] before proceeding.</p>
                  
                  <h4>6. Safe Sport Code</h4>
                  <p>The Safe Sport Code is a set of guidelines developed by the Ministry of Youth and Sports (KBS) to guide the creation of a safe sports environment with clear guidelines that define the jurisdiction of all parties in addressing disruptions and abuse in sports. The participant is required to read and adhere to the code. (please obtain the Safe Sport Code from the Organiser).</p>
                  
                  <h4>7. CONCLUSION</h4>
                  <p>We appreciate your cooperation in upholding these standards of respect, safety, and sportsmanship. Together, we can ensure that [Tournament Name] remains a fun, safe, and positive environment for all participants.</p>
                  
                  <p><strong>On behalf of the Organising Committee</strong></p>
                  <p>______________________<br/>Tournament Director</p>
                  
                  <div className="template-note">
                    <p><strong>**The Tournament Code of Conduct provided by the MPA is a template designed to serve as a guideline for organizers. Organizers are encouraged to review and adapt the document as necessary to ensure it aligns with the specific requirements, values, and context of their tournament. Any modifications should be made in consultation with relevant stakeholders (e.g.:- The Organising Committee) to maintain fairness, inclusivity, and compliance with applicable regulations.)</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowTournamentGuidelines(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Important Notice Component
  const renderImportantNotice = () => (
    <div className="tournament-guidelines-modal">
      <div className="modal-overlay" onClick={() => setShowImportantNotice(false)}>
        <div className="modal-content tournament-guidelines-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Important Notice</h2>
            <button className="modal-close-btn" onClick={() => setShowImportantNotice(false)}>
              ×
            </button>
          </div>
          
          <div className="modal-body tournament-guidelines-body">
            <div className="guidelines-section">
              <p>The Malaysia Pickleball Association recognizes the commendable efforts and the significance of such tournaments in developing the sport and participation, developing talent, and enhancing the country's pickleball profile. However, we would like to remind you of the following key actions to ensure the smooth and successful execution of the tournament:</p>
            </div>

            <div className="guidelines-section">
              <h3>1. Permit Application with the Pesuruhjaya Sukan Malaysia (PJS)</h3>
              <p>Please ensure that you apply for the necessary permits from the Pesuruhjaya Sukan Malaysia (PJS) before the event commences. Compliance with government regulations is essential to legitimizing the tournament and avoiding potential issues. The application for using the KBS logo must be submitted via the link <a href="https://www.kbs.gov.my/logo-kbs.html" target="_blank" rel="noopener noreferrer" style={{color: '#007bff', textDecoration: 'underline'}}>https://www.kbs.gov.my/logo-kbs.html</a>. Once approval has been granted, the KBS logo must be displayed on the tournament banners/promotional media during the tournament.</p>
            </div>

            <div className="guidelines-section">
              <h3>2. Safety Protocols</h3>
              <p>The safety and well-being of all participants, officials, and spectators must remain a top priority. We urge you to implement comprehensive safety measures, including first aid provisions, proper court maintenance, and adherence to health guidelines as per local authorities. Additionally, provide qualified first-aiders/medical personnel and ambulance standby throughout the event. Personal accident insurance is compulsory for the players.</p>
            </div>

            <div className="guidelines-section">
              <h3>3. MPA Logo</h3>
              <p>All promotional materials (banners, social media posts, flyers, etc.) must prominently display the Malaysia Pickleball Association Logo.</p>
            </div>

            <div className="guidelines-section">
              <h3>4. Additional Guidelines</h3>
              <p>Please adhere to the additional guidelines attached to the letter to ensure the tournament is well-organized, professionally executed, and maintains the integrity of the sport. We would also like to highlight that, in line with the official Pickleball scoring (and for the benefit of the participants), for each match please adopt the Traditional Scoring (002) of up to 11 pts (or more); however, if the organizer, for whatever reason(s), wish to adopt the Rally Scoring, the points for each match must not be less than 21.</p>
            </div>

            <div className="guidelines-section">
              <h3>5. Registration Fee Advisory</h3>
              <p>To promote inclusivity and accessibility in pickleball, the Malaysia Pickleball Association (MPA) strongly advises all tournament organisers to cap registration fees for Malaysian participants at a maximum of <strong>RM200 per person</strong>.</p>
              <p>This guideline is intended to encourage broader participation across diverse community groups while ensuring tournaments remain affordable at all levels of competition.</p>
            </div>

            <div className="guidelines-section">
              <h3>6. Cancellation Penalty</h3>
              <p>Should the organizer wish to cancel their event, Malaysia Pickleball Association (MPA) must be notified in writing at least thirty (30) days prior to the scheduled event date, failing which a penalty of <strong>MYR5,000</strong> will be imposed on the organizer.</p>
            </div>

            <div className="guidelines-section important">
              <h3>Important</h3>
              <p>The association shall not be held liable or responsible for any deaths, accidents, injuries, mishaps that may occur during the event. It is the organizer's responsibility to ensure that all participants sign a consent and indemnification form before participating in the event.</p>
              <p>Please also seek a support letter from your respective State Pickleball Association.</p>
              <p><strong>This support letter shall become null and void if the organizer fails to obtain the approved permit from the Pesuruhjaya Sukan Malaysia (PJS).</strong></p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn-secondary" onClick={() => setShowImportantNotice(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch(currentPage) {
      case 'login':
        return <Login setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
      case 'admin':
        return isLoggedIn ? <AdminDashboard setCurrentPage={setCurrentPage} globalAssessmentSubmissions={globalAssessmentSubmissions} /> : <Login setCurrentPage={setCurrentPage} setIsLoggedIn={setIsLoggedIn} />;
      case 'register-organization':
        return <OrganizationRegistration setCurrentPage={setCurrentPage} />;
      case 'organization-terms':
        return <OrganizationTermsAndConditions setCurrentPage={setCurrentPage} />;
      case 'organization-privacy':
        return <OrganizationPrivacyPolicy setCurrentPage={setCurrentPage} />;
      case 'tournament-application':
        return <TournamentApplication setCurrentPage={setCurrentPage} />;
      case 'status':
        return <ApplicationStatus setCurrentPage={setCurrentPage} />;
      case 'terms':
        return <TermsAndConditions setCurrentPage={setCurrentPage} />;
      case 'about':
        return (
          <div className="page-content">
            <div className="hero-section">
              <h1>About Malaysia Pickleball Association</h1>
              <p className="hero-subtitle">Governing and promoting pickleball sports across Malaysia</p>
            </div>
            <div className="content-grid">
              <div className="content-card">
                <h3>Our Mission</h3>
                <p>To develop, promote and govern the sport of pickleball throughout Malaysia, fostering excellence at all levels from grassroots to elite competition.</p>
              </div>
              <div className="content-card">
                <h3>Our Vision</h3>
                <p>To establish Malaysia as a leading nation in pickleball within the Southeast Asian region and beyond.</p>
              </div>
              <div className="content-card">
                <h3>Governance</h3>
                <p>As the official governing body, we ensure fair play, maintain standards, and oversee all sanctioned tournaments and competitions.</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="page-content">
            <div className="hero-section">
              <h1>Contact Malaysia Pickleball Association</h1>
              <p className="hero-subtitle">Get in touch with our team for assistance</p>
            </div>
            <div className="contact-content">
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <h3>Phone</h3>
                  <p>+60 3-1234 5678</p>
                  <p>Monday - Friday, 9:00 AM - 5:00 PM</p>
                </div>
                <div className="contact-method">
                  <div className="method-icon">✉️</div>
                  <h3>Email</h3>
                  <p>info@malaysiapickleball.org</p>
                  <p>We'll respond within 24 hours</p>
                </div>
                <div className="contact-method">
                  <div className="method-icon">📍</div>
                  <h3>Office</h3>
                  <p>Level 3, Sports Complex</p>
                  <p>Kuala Lumpur, Malaysia</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="home-content">
            {/* Hero Section */}
            <section className="hero-banner">
              <div className="hero-content">
                <img src={mpaLogo} alt="MPA Logo" className="hero-logo" />
                <div className="hero-portal-text">Portal</div>
                <h1 className="hero-title">Malaysia Pickleball Association</h1>
                <p className="hero-subtitle">Official Tournament Management Portal</p>
                <p className="hero-description">
                  Your gateway to competitive pickleball in Malaysia. Apply for tournaments,
                  track your applications, and join our growing community of players.
                </p>

                <div className="hero-actions">
                  <div className="hero-actions-column">
                    <button
                      className="cta-assessment"
                      onClick={() => setShowAssessmentModal(true)}
                    >
                      Assessment
                    </button>
                    <div className="hero-actions-row">
                      <div className="apply-dropdown-container">
                        <button
                          className="cta-primary dropdown-toggle"
                          onClick={handleDropdownToggle}
                        >
                          Apply for Tournament
                          <span className={`dropdown-arrow ${showApplyDropdown ? 'open' : ''}`}>▼</span>
                        </button>

                        {showApplyDropdown && (
                          <div className="apply-dropdown-menu">
                            <div className="dropdown-header">
                              <h4>Quick Resources</h4>
                              <p>Review these important documents before applying</p>
                            </div>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setShowTournamentGuidelines(true);
                                setShowApplyDropdown(false);
                              }}
                            >
                              <div className="dropdown-content">
                                <strong>Tournament Guidelines</strong>
                                <small>Complete guide for organizers</small>
                              </div>
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setShowImportantNotice(true);
                                setShowApplyDropdown(false);
                              }}
                            >
                              <div className="dropdown-content">
                                <strong>Important Notice</strong>
                                <small>Key requirements and regulations</small>
                              </div>
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                window.open(safeSportCodePDF, '_blank');
                                setShowApplyDropdown(false);
                              }}
                            >
                              <div className="dropdown-content">
                                <strong>Safe Sport Code</strong>
                                <small>Safety guidelines and protocols</small>
                              </div>
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                              className="dropdown-item primary-action"
                              onClick={() => {
                                setShowLoginModal(true);
                                setShowApplyDropdown(false);
                              }}
                            >
                              <div className="dropdown-content">
                                <strong>Start Application</strong>
                                <small>Begin tournament application process</small>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        className="cta-secondary"
                        onClick={() => setCurrentPage('status')}
                      >
                        Check Application Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Collapsible Notice Portal */}
            <section className={`notice-portal ${isNoticePortalExpanded ? 'expanded' : 'collapsed'}`}>
              {!isNoticePortalExpanded ? (
                // Collapsed state - just the button
                <button 
                  className="notice-portal-toggle"
                  onClick={() => setIsNoticePortalExpanded(true)}
                  title="View Notices"
                >
                  <span className="notice-icon">I</span>
                  {getActiveNotices().length > 0 && (
                    <span className="notice-count">{getActiveNotices().length}</span>
                  )}
                </button>
              ) : (
                // Expanded state - full portal
                <>
                  <div className="notice-portal-header">
                    <div className="notice-header-content">
                      <h2>📢 Notice Portal</h2>
                      <p>Important announcements and updates from Malaysia Pickleball Association</p>
                    </div>
                    <button 
                      className="notice-portal-close"
                      onClick={() => setIsNoticePortalExpanded(false)}
                      title="Collapse"
                    >
                      ×
                    </button>
                  </div>
                  <div className="notice-board">
                {getActiveNotices().length === 0 ? (
                  <div className="notice-item info">
                    <div className="notice-badge">📢 INFO</div>
                    <div className="notice-date">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <h3>No Active Notices</h3>
                    <p>There are currently no active notices. Check back later for important announcements and updates.</p>
                  </div>
                ) : (
                  getActiveNotices().map((notice) => {
                    const getBadgeIcon = (type) => {
                      switch(type) {
                        case 'urgent': return '🚨 URGENT';
                        case 'important': return '⚠️ IMPORTANT';
                        case 'info': return 'ℹ️ INFO';
                        case 'general': return '📋 GENERAL';
                        default: return '📢 NOTICE';
                      }
                    };

                    const formatDate = (dateString) => {
                      const date = new Date(dateString);
                      return date.toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      });
                    };

                    return (
                      <div key={notice.id} className={`notice-item ${notice.type}`}>
                        <div className="notice-badge">{getBadgeIcon(notice.type)}</div>
                        <div className="notice-date">{formatDate(notice.date)}</div>
                        <h3>{notice.title}</h3>
                        <p>{notice.content}</p>
                        {notice.actions && notice.actions.length > 0 && (
                          <div className="notice-actions">
                            {notice.actions.map((action, index) => (
                              <button 
                                key={index}
                                className={`notice-btn-${action.type}`}
                                onClick={() => {
                                  // Handle different action types
                                  if (action.action === 'showLoginModal') {
                                    setShowLoginModal(true);
                                  } else if (action.action === 'goToStatus') {
                                    setCurrentPage('status');
                                  } else if (action.action === 'showTournamentGuidelines') {
                                    setShowTournamentGuidelines(true);
                                  } else if (action.action === 'downloadSafeSportCode') {
                                    window.open(safeSportCodePDF, '_blank');
                                  }
                                }}
                              >
                                {action.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}



                  </div>
                  <div className="notice-portal-footer">
                  </div>
                </>
              )}
            </section>

          </div>
        );
    }
  };

  return (
    <div className="App">
      {currentPage !== 'login' && <Header currentPage={currentPage} setCurrentPage={setCurrentPage} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
      <main className="App-main">
        {renderPage()}
      </main>
      {currentPage !== 'login' && <Footer />}
      
      <OrganizationLoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => setCurrentPage('tournament-application')}
        onRegisterClick={() => {
          setCurrentPage('register-organization');
          setShowLoginModal(false);
        }}
      />

      {/* Tournament Guidelines Modal */}
      {showTournamentGuidelines && renderTournamentGuidelines()}

      {/* Important Notice Modal */}
      {showImportantNotice && renderImportantNotice()}

      {/* Assessment System */}
      <AssessmentSystem
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onSubmissionSave={saveAssessmentSubmission}
      />
    </div>
  );
}

export default App;
