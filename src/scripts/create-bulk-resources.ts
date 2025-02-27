// @ts-nocheck
const axios = require('axios');
const fs = require('fs');
const path = require('path');


// Configuration - Update these values
const API_URL = 'http://localhost:3000/api/v1/resource'; // Change to your actual API URL
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEwZDE5Nzg4LTJjZTQtNGZlMS1iZDhlLTQxMmQyZTQ4ZWM3YiIsImVtYWlsIjoiNEBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc0MDY2MDU3NiwiZXhwIjoxNzQxMjY1Mzc2fQ.9gY76QjYQyGGbCD7hmDZTPDpWTVCuEqCnYGAChsVeHQ'; // Replace with an actual admin token
const RESOURCES_FILE = path.join(__dirname, 'resources.json');

// ResourceType mapping
const ResourceType = {
    YOUTUBE_VIDEO: 'VIDEO',
    BLOG_POST: 'BLOG',
    LEETCODE_QUESTION: 'LEETCODE'
};

// Function to map your resource format to the API format
function mapResourceToApiFormat(resource) {
    return {
        title: resource.topicName,
        description: resource.topicDescription,
        type: ResourceType[resource.type] || 'VIDEO',
        url: resource.url
    };
}

// Function to create a resource via API
async function createResource(resource) {
    try {
        const response = await axios.post(`${API_URL}`, resource, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        console.log(`✅ Resource created: ${resource.title}`);
        return response.data;
    } catch (error) {
        console.error(`❌ Failed to create resource "${resource.title}": ${error.message}`);
        throw error;
    }
}

// Main function to seed resources
async function seedResources() {
    try {
        console.log('Starting resource seeding process...');

        // Read and parse resources file
        const rawData = fs.readFileSync(RESOURCES_FILE, 'utf8');
        let resources = JSON.parse(rawData);

        // Handle single object or array
        if (!Array.isArray(resources)) {
            resources = [resources];
        }

        console.log(`Found ${resources.length} resources to seed.`);

        // Create each resource
        let successCount = 0;
        let failCount = 0;

        for (const resource of resources) {
            try {
                const apiResource = mapResourceToApiFormat(resource);
                await createResource(apiResource);
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        console.log(`\nSeeding completed: ${successCount} resources created, ${failCount} failed.`);
    } catch (error) {
        console.error('Failed to seed resources:', error.message);
    }
}

// Run the script
seedResources();