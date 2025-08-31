// Simple test script for the scholarship backend service
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testBackend() {
  console.log('🧪 Testing Scholarship Backend Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Automation Stats
    console.log('2. Testing Automation Stats...');
    const statsResponse = await axios.get(`${BASE_URL}/scholarships/automation-stats`);
    console.log('✅ Automation Stats:', statsResponse.data);
    console.log('');

    // Test 3: Automation Config
    console.log('3. Testing Automation Config...');
    const configResponse = await axios.get(`${BASE_URL}/scholarships/automation-config`);
    console.log('✅ Automation Config:', configResponse.data);
    console.log('');

    // Test 4: Automation Logs
    console.log('4. Testing Automation Logs...');
    const logsResponse = await axios.get(`${BASE_URL}/scholarships/automation-logs`);
    console.log('✅ Automation Logs:', logsResponse.data);
    console.log('');

    // Test 5: External Scholarship Fetching (Mock)
    console.log('5. Testing External Scholarship Fetching...');
    const fetchResponse = await axios.post(`${BASE_URL}/scholarships/fetch-external`, {
      sourceType: 'all'
    });
    console.log('✅ External Fetch:', {
      success: fetchResponse.data.success,
      count: fetchResponse.data.count
    });
    console.log('');

    // Test 6: Test Source
    console.log('6. Testing Source Testing...');
    const testResponse = await axios.post(`${BASE_URL}/scholarships/test-source`, {
      sourceConfig: {
        name: 'Test Source',
        url: 'https://example.com',
        type: 'scrape',
        selectors: {
          container: '.test',
          title: '.title',
          amount: '.amount',
          deadline: '.deadline',
          description: '.description'
        }
      }
    });
    console.log('✅ Source Test:', testResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Backend service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend');
      console.log('   npm install');
      console.log('   npm run dev');
    }
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testBackend();


