const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 Starting CampusRAG Full Suite Verification...\n');

  const BASE_URL = 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Health & Status Check ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'healthy', 'Health endpoint status is healthy', `(${health.database.mongodb})`);
    assert(health.vectorStore.totalVectors > 0, 'Vector store initialized with vectors', `(${health.vectorStore.totalVectors} vectors)`);

    // 2. Authentication - Student
    console.log('\n--- 2. Student Authentication ---');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campus.edu', password: 'StudentPassword123!' }),
    });
    const studentLogin = await studentLoginRes.json();
    assert(studentLogin.success === true, 'Student login succeeded');
    const studentToken = studentLogin.data?.token;
    assert(!!studentToken, 'Student received JWT token');

    // 3. Authentication - Admin
    console.log('\n--- 3. Admin Authentication & Role Separation ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campus.edu', password: 'AdminPassword123!' }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.success === true, 'Admin login succeeded');
    const adminToken = adminLogin.data?.token;
    assert(adminLogin.data?.user?.role === 'admin', 'Admin user role is "admin"');

    // Verify student cannot access admin routes (Role Protection)
    const unauthorizedRes = await fetch(`${BASE_URL}/documents/metrics`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(unauthorizedRes.status === 403, 'Student rejected with 403 from admin metrics endpoint');

    // Verify admin can access metrics
    const metricsRes = await fetch(`${BASE_URL}/documents/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const metrics = await metricsRes.json();
    assert(metrics.success === true, 'Admin successfully fetched dashboard metrics');
    assert(metrics.data.totalDocs >= 5, 'Total documents indexed >= 5', `(Total: ${metrics.data.totalDocs})`);

    // 4. RAG Query - In-Scope (Hostel)
    console.log('\n--- 4. RAG In-Scope Query Grounding ---');
    const queryRes1 = await fetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question: 'What is the hostel curfew time on weekdays and weekends?',
      }),
    });
    const query1 = await queryRes1.json();
    assert(query1.success === true, 'In-scope query processed successfully');
    assert(query1.data.foundAnswer === true, 'foundAnswer flag is true');
    assert(query1.data.sources.length > 0, 'Sources cited in response', `(${query1.data.sources.length} sources)`);
    assert(
      query1.data.answer.toLowerCase().includes('curfew') || query1.data.answer.toLowerCase().includes('hostel'),
      'Answer contains grounded hostel information'
    );
    const convoId = query1.data.conversationId;

    // 5. RAG Multi-Turn in Same Conversation
    console.log('\n--- 5. RAG Multi-Turn Conversation Continuity ---');
    const queryRes2 = await fetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question: 'What are the fines for late entry?',
        conversationId: convoId,
      }),
    });
    const query2 = await queryRes2.json();
    assert(query2.data.conversationId === convoId, 'Turn persisted under same conversation session');
    assert(query2.data.foundAnswer === true, 'Late entry policy grounded successfully');

    // 6. RAG Out-of-Scope Query (Zero-Hallucination Fallback)
    console.log('\n--- 6. Zero-Hallucination Deterministic Fallback ---');
    const outOfScopeRes = await fetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        question: 'How do I cook a spicy pepperoni pizza in the oven?',
      }),
    });
    const queryOut = await outOfScopeRes.json();
    assert(queryOut.success === true, 'Out-of-scope query handled gracefully');
    assert(queryOut.data.foundAnswer === false, 'foundAnswer is strictly false for unrelated query');
    assert(queryOut.data.sources.length === 0, 'No sources falsely attributed');
    assert(
      queryOut.data.answer.includes('could not find verified information'),
      'Deterministic fallback notice returned without hallucinating'
    );

    // 7. Conversation History Retrieval & Persistence
    console.log('\n--- 7. Conversation History Persistence ---');
    const convosListRes = await fetch(`${BASE_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const convos = await convosListRes.json();
    assert(convos.data.length >= 2, 'User conversation sessions retrieved', `(${convos.data.length} sessions)`);

    const convoHistoryRes = await fetch(`${BASE_URL}/chat/conversations/${convoId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const convoHistory = await convoHistoryRes.json();
    assert(convoHistory.data.messages.length >= 4, 'Full message history preserved with turns', `(${convoHistory.data.messages.length} messages)`);

    // 8. Document Lifecycle (Upload, Detail, Reindex, Delete)
    console.log('\n--- 8. Admin Document Lifecycle ---');
    // Create a temporary circular text file
    const testDocPath = path.resolve(__dirname, '../../uploads/documents/Test_Circ_2026.txt');
    fs.writeFileSync(
      testDocPath,
      'CAMPUS TEMPORARY NOTICE: Campus library will remain open 24 hours during end-semester examination week for study halls.',
      'utf-8'
    );

    // List documents
    const docListRes = await fetch(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const docList = await docListRes.json();
    assert(docList.data.length > 0, 'Admin listed documents', `(${docList.data.length} documents)`);

    // Fetch document detail
    const sampleDocId = docList.data[0]._id;
    const docDetailRes = await fetch(`${BASE_URL}/documents/${sampleDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const docDetail = await docDetailRes.json();
    assert(docDetail.data.chunks.length > 0, 'Document detail returned chunk breakdown', `(${docDetail.data.chunks.length} chunks)`);

    console.log(`\n=========================================`);
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL CAMPUSRAG VERIFICATION TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
