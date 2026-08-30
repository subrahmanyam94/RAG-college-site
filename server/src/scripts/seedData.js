const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const documentService = require('../services/documentService');
const vectorStore = require('../config/vectorStore');

const uploadsDir = path.resolve(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const sampleDocuments = [
  {
    title: 'Admissions and Eligibility Guide 2026-2027',
    originalName: 'Admissions_Guide_2026.txt',
    category: 'Admissions',
    department: 'Admissions Office',
    content: `CAMPUS ADMISSIONS & ELIGIBILITY REGULATIONS 2026-2027
Official Circular Ref: ADM-2026/01

1. UNDERGRADUATE ELIGIBILITY CRITERIA
Applicants for B.Tech / B.E. programs must have completed 10+2 or equivalent examination with Physics, Mathematics, and Chemistry/Computer Science. A minimum aggregate of 60% (55% for reserved categories) in qualifying examinations is mandatory.
For B.Sc and B.A. programs, candidates must have secured at least 50% aggregate marks in relevant streams.

2. APPLICATION DEADLINES & ADMISSION DATES
- Online Application Opens: March 15, 2026
- Application Deadline: June 20, 2026 at 11:59 PM IST
- Entrance Examination / Merit List Publication: July 5, 2026
- First Round Counseling & Seat Acceptance: July 12 - July 18, 2026
- Commencement of Orientation Week: August 1, 2026

3. REQUIRED DOCUMENTS FOR VERIFICATION
All candidates allotted a seat must submit original and two self-attested photocopies of:
- Class 10 and Class 12 Mark sheets and Passing Certificates
- Transfer Certificate (TC) and Migration Certificate
- Category/Caste Certificate (if claiming reservation benefits)
- Four recent passport-size photographs
- Government-issued ID proof (Aadhar Card, Passport, or Voter ID)
- Medical Fitness Certificate from a certified medical practitioner.

4. LATERAL ENTRY ADMISSIONS
Diploma holders in Engineering with minimum 65% aggregate marks are eligible for direct admission to the second year (3rd semester) of B.Tech across all branches. Lateral entry seats are capped at 10% of total sanctioned intake.`,
  },
  {
    title: 'Hostel Accommodation Rules and Fee Structure',
    originalName: 'Hostel_Rules_and_Fees_2026.txt',
    category: 'Hostel',
    department: 'Chief Warden Office',
    content: `CAMPUS RESIDENTIAL LIVING: HOSTEL REGULATIONS & FEE SCHEDULE
Issued by the Office of the Chief Warden

1. ROOM ALLOTMENT & ELIGIBILITY
Hostel accommodation is guaranteed for all first-year outstation undergraduate students. Allotment is carried out on a twin-sharing basis for Year 1 and Year 2, and single occupancy for final year students based on CGPA seniority.

2. HOSTEL FEE STRUCTURE (ANNUAL)
- Double Occupancy Non-AC: $1,400 per academic year (USD equivalent or INR 85,000)
- Double Occupancy AC Room: $2,000 per academic year (USD equivalent or INR 1,20,000)
- Caution Deposit (Refundable upon vacating): $200 (INR 15,000)
- Mandatory Mess Advance: $1,000 per year covering breakfast, lunch, evening snacks, and dinner.
All hostel dues must be cleared within 10 days of semester registration.

3. HOSTEL CURFEW & TIMINGS
- Main Gate Curfew: All hostel residents must enter the hostel premises before 9:30 PM on weekdays and 10:30 PM on weekends (Saturday and Sunday).
- Biometric attendance is recorded nightly between 9:30 PM and 10:00 PM.
- Late entries without prior written permission from the Warden attract a fine of $15 for the first violation and parent notification for repeated violations.

4. NIGHT-OUT PERMISSION POLICY
Students seeking leave or overnight absence must submit an online e-gatepass through the Student Portal at least 24 hours in advance, verified with parent SMS/email consent. Maximum 4 night-outs are permitted per month.

5. CODE OF CONDUCT
Possession or consumption of alcohol, tobacco, narcotics, or prohibited electrical appliances (immersion heaters, induction stoves) inside hostel rooms is strictly prohibited and results in immediate expulsion and disciplinary inquiry.`,
  },
  {
    title: 'Academic Regulations, Grading System and Examination Policies',
    originalName: 'Academic_Regulations_2026.txt',
    category: 'Exams',
    department: 'Controller of Examinations',
    content: `INSTITUTIONAL ACADEMIC REGULATIONS & EVALUATION SYSTEM
Approved by the Academic Council

1. MANDATORY ATTENDANCE REQUIREMENT
Students must maintain a minimum of 75% attendance in each registered theory course and 85% attendance in laboratory sessions to be eligible to appear for the End-Semester Final Examination.
A condonation of up to 10% (between 65% and 74.9%) may be granted by the Dean of Academic Affairs strictly on valid medical grounds, provided medical certificates are submitted within 5 working days of resumption of classes. Students below 65% attendance receive an 'FA' (Failed due to Attendance) grade and must repeat the course.

2. GRADING SCALE & CGPA CALCULATION
The institute operates on a 10-point relative grading scale:
- Grade 'O' (Outstanding): 10 Grade Points (Top 5-10% of class)
- Grade 'A+' (Excellent): 9 Grade Points
- Grade 'A' (Very Good): 8 Grade Points
- Grade 'B+' (Good): 7 Grade Points
- Grade 'B' (Above Average): 6 Grade Points
- Grade 'C' (Average): 5 Grade Points (Minimum passing grade)
- Grade 'F' (Fail): 0 Grade Points (Must reappear for supplementary examination)
Cumulative Grade Point Average (CGPA) is computed as: sum(Course Credits * Grade Points) / sum(Total Registered Credits).

3. SUPPLEMENTARY AND RE-EVALUATION EXAMINATIONS
Students scoring an 'F' grade may register for the Supplementary Examination held within 30 days after the declaration of regular semester results. A fee of $25 per paper applies.
Re-evaluation applications must be submitted within 7 calendar days of grade card publication along with the prescribed re-checking fee.`,
  },
  {
    title: 'Training and Placement Cell Policy and Internship Guidelines',
    originalName: 'Placement_and_Internship_Policy_2026.txt',
    category: 'Placements',
    department: 'Career Services',
    content: `CAMPUS CAREER DEVELOPMENT CENTER: PLACEMENT & INTERNSHIP DIRECTIVES

1. PLACEMENT ELIGIBILITY
Students are eligible to register with the Training & Placement Cell (TPC) at the beginning of the 7th semester provided they meet the following:
- Minimum CGPA of 6.5 or above with no active backlogs / uncleared arrears.
- Minimum 80% attendance in Pre-Placement Training (PPT), mock interviews, and soft-skill workshops.

2. ONE-STUDENT-ONE-OFFER POLICY
The institute enforces a strict 'One-Student-One-Offer' policy to ensure equitable opportunities for all graduates.
- Once a student receives a verified campus placement offer from a recruiter, they are deemed placed and cannot appear for further recruitment drives.
- Exception (Dream Offer): If a company offers a Compensation Package (CTC) exceeding 1.75 times the student's initial offer, the student is granted eligibility to appear for up to two 'Dream Company' interview drives.

3. SUMMER INTERNSHIP REQUIREMENT
All 6th semester undergraduate engineering and management students must undertake a mandatory 8-to-10 week summer internship between June and August.
- Internships may be secured through TPC campus drives or self-arranged off-campus with prior No-Objection Certificate (NOC) from the Department Head.
- An internship report and viva-voce presentation carry 3 academic credits evaluated in the 7th semester.`,
  },
  {
    title: 'Scholarships and Financial Aid Regulations',
    originalName: 'Scholarships_and_Aid_2026.txt',
    category: 'Scholarships',
    department: 'Student Welfare Cell',
    content: `CAMPUS FINANCIAL AID & MERIT SCHOLARSHIP SCHEMES

1. MERIT SCHOLARSHIPS
- President's Merit Fellowship: 100% tuition fee waiver granted to the top 3 entrance rank holders and students maintaining a CGPA >= 9.50 each semester.
- Dean's Honor Scholarship: 50% tuition fee waiver for students scoring a CGPA between 9.00 and 9.49 in the preceding academic year.

2. NEED-BASED FINANCIAL AID (MEANS-CUM-MERIT)
Students whose total family annual income from all sources is less than $6,000 (INR 5,00,000) are eligible for a 40% to 75% fee concession.
Applicants must submit income tax returns (ITR) or Tahsildar Income Certificate alongside the application before August 30 each year.

3. SPORTS & EXCELLENCE CONCESSIONS
Athletes who have represented national or state teams in recognized sporting events receive 30% tuition fee reduction and personalized academic mentorship to balance competition schedules.`,
  },
];

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[Seed] Connected to MongoDB');

    // 1. Seed Admin User
    let admin = await User.findOne({ email: 'admin@campus.edu' });
    if (!admin) {
      admin = new User({
        name: 'Campus Administrator',
        email: 'admin@campus.edu',
        password: 'AdminPassword123!',
        role: 'admin',
        department: 'Administration',
      });
      await admin.save();
      console.log('[Seed] Admin user created: admin@campus.edu (Password: AdminPassword123!)');
    } else {
      console.log('[Seed] Admin user already exists: admin@campus.edu');
    }

    // 2. Seed Student User
    let student = await User.findOne({ email: 'student@campus.edu' });
    if (!student) {
      student = new User({
        name: 'Alex Student',
        email: 'student@campus.edu',
        password: 'StudentPassword123!',
        role: 'student',
        department: 'Computer Science',
      });
      await student.save();
      console.log('[Seed] Student user created: student@campus.edu (Password: StudentPassword123!)');
    } else {
      console.log('[Seed] Student user already exists: student@campus.edu');
    }

    // 3. Seed Sample Documents & Embeddings
    console.log('[Seed] Checking sample documents...');
    for (const docData of sampleDocuments) {
      const existing = await Document.findOne({ title: docData.title });
      if (!existing) {
        // Write content to file
        const filePath = path.join(uploadsDir, docData.originalName);
        fs.writeFileSync(filePath, docData.content, 'utf-8');

        const fileMock = {
          originalname: docData.originalName,
          filename: docData.originalName,
          size: Buffer.byteLength(docData.content),
          mimetype: 'text/plain',
          path: filePath,
        };

        const doc = await documentService.processDocumentUpload({
          file: fileMock,
          title: docData.title,
          category: docData.category,
          department: docData.department,
          userId: admin._id,
        });

        // Force synchronous indexing for seed
        await documentService.indexDocument(doc._id);
        console.log(`[Seed] Indexed document: "${docData.title}"`);
      } else {
        console.log(`[Seed] Document already indexed: "${docData.title}"`);
      }
    }

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
}

seed();
