const fs = require('fs');
const path = require('path');
const https = require('https');

// Set up globals that Three.js expects in browser environment
global.self = global;
global.document = {
    createElement: () => ({
        getContext: () => null,
        addEventListener: () => {},
    }),
    createElementNS: () => ({}),
};
global.window = global;
global.HTMLImageElement = class {};
global.HTMLCanvasElement = class {};

const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');

// URL of the Ready Player Me GLB file
const GLB_URL = 'https://models.readyplayer.me/68ea9e6ec138a9c842570bf9.glb';
const GLB_FILENAME = 'avatar.glb';
const OUTPUT_FILENAME = 'bone-analysis.txt';

async function downloadGLB(url, filename) {
    return new Promise((resolve, reject) => {
        console.log('Downloading GLB file...');
        const file = fs.createWriteStream(filename);

        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('GLB file downloaded successfully!');
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(filename, () => {}); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function analyzeBoneStructure(gltf) {
    const bones = new Set();
    const boneHierarchy = {};
    const processedSkeletons = new Set();

    // Find all SkinnedMesh objects and their skeletons
    gltf.scene.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
            const skeleton = child.skeleton;
            const skeletonId = skeleton.uuid;

            // Skip if we already processed this skeleton
            if (processedSkeletons.has(skeletonId)) {
                console.log('Skipping already processed skeleton');
                return;
            }
            processedSkeletons.add(skeletonId);

            console.log('Found SkinnedMesh with skeleton');

            skeleton.bones.forEach((bone, index) => {
                const boneName = bone.name;
                bones.add(boneName);

                // Build hierarchy information
                const parent = bone.parent && bone.parent.name ? bone.parent.name : 'ROOT';
                if (!boneHierarchy[parent]) {
                    boneHierarchy[parent] = [];
                }
                if (!boneHierarchy[parent].includes(boneName)) {
                    boneHierarchy[parent].push(boneName);
                }

                console.log(`Bone ${index}: ${boneName} (parent: ${parent})`);
            });
        }
    });

    // Also check for Bone objects directly in the scene
    gltf.scene.traverse((child) => {
        if (child.isBone) {
            const boneName = child.name;
            bones.add(boneName);

            const parent = child.parent && child.parent.name ? child.parent.name : 'ROOT';
            if (!boneHierarchy[parent]) {
                boneHierarchy[parent] = [];
            }
            if (!boneHierarchy[parent].includes(boneName)) {
                boneHierarchy[parent].push(boneName);
            }
        }
    });

    return { bones: Array.from(bones), boneHierarchy };
}

function identifyKeyBones(bones) {
    const keyBones = {
        root: null,
        head: [],
        neck: [],
        spine: []
    };

    // Find root bone (usually Armature, Hips, or similar)
    const rootCandidates = bones.filter(bone =>
        /^(armature|hips|root|pelvis)$/i.test(bone)
    );
    keyBones.root = rootCandidates[0] || null;

    // Find head bones
    keyBones.head = bones.filter(bone =>
        /head/i.test(bone)
    );

    // Find neck bones
    keyBones.neck = bones.filter(bone =>
        /neck/i.test(bone)
    );

    // Find spine bones
    keyBones.spine = bones.filter(bone =>
        /spine/i.test(bone)
    );

    return keyBones;
}

function generateReport(bones, boneHierarchy, keyBones) {
    let report = '';
    report += '='.repeat(60) + '\n';
    report += 'READY PLAYER ME GLB BONE ANALYSIS REPORT\n';
    report += '='.repeat(60) + '\n\n';

    report += `Analysis Date: ${new Date().toISOString()}\n`;
    report += `GLB URL: ${GLB_URL}\n`;
    report += `Total Bones Found: ${bones.length}\n\n`;

    report += 'KEY BONES IDENTIFIED:\n';
    report += '-'.repeat(30) + '\n';
    report += `Root Bone: ${keyBones.root || 'NOT FOUND'}\n`;
    report += `Head Bones: ${keyBones.head.length > 0 ? [...new Set(keyBones.head)].join(', ') : 'NOT FOUND'}\n`;
    report += `Neck Bones: ${keyBones.neck.length > 0 ? [...new Set(keyBones.neck)].join(', ') : 'NOT FOUND'}\n`;
    report += `Spine Bones: ${keyBones.spine.length > 0 ? [...new Set(keyBones.spine)].join(', ') : 'NOT FOUND'}\n\n`;

    report += 'COMPLETE BONE LIST (Alphabetical):\n';
    report += '-'.repeat(30) + '\n';
    const sortedBones = [...bones].sort();
    sortedBones.forEach((bone, index) => {
        report += `${(index + 1).toString().padStart(3)}: ${bone}\n`;
    });

    report += '\nBONE HIERARCHY:\n';
    report += '-'.repeat(30) + '\n';
    Object.keys(boneHierarchy).forEach(parent => {
        report += `${parent}:\n`;
        boneHierarchy[parent].forEach(child => {
            report += `  ├─ ${child}\n`;
        });
        report += '\n';
    });

    report += 'TALKINGHEAD CONFIGURATION SUGGESTIONS:\n';
    report += '-'.repeat(30) + '\n';
    if (keyBones.root) {
        report += `Root bone for TalkingHead: "${keyBones.root}"\n`;
    }
    if (keyBones.head.length > 0) {
        report += `Head bone for TalkingHead: "${keyBones.head[0]}"\n`;
    }
    if (keyBones.neck.length > 0) {
        report += `Neck bone for TalkingHead: "${keyBones.neck[0]}"\n`;
    }
    if (keyBones.spine.length > 0) {
        report += `Spine bones for TalkingHead: ${[...new Set(keyBones.spine)].map(b => `"${b}"`).join(', ')}\n`;
    }

    return report;
}

async function main() {
    try {
        // Download the GLB file
        await downloadGLB(GLB_URL, GLB_FILENAME);

        // Load and parse the GLB file
        console.log('Loading and parsing GLB file...');
        const loader = new GLTFLoader();

        // Read the GLB file as buffer
        const glbBuffer = fs.readFileSync(GLB_FILENAME);

        // Parse the GLB file
        const gltf = await new Promise((resolve, reject) => {
            loader.parse(glbBuffer.buffer, '', resolve, reject);
        });

        console.log('GLB file loaded successfully!');
        console.log('Scene children count:', gltf.scene.children.length);

        // Analyze bone structure
        console.log('Analyzing bone structure...');
        const { bones, boneHierarchy } = analyzeBoneStructure(gltf);

        if (bones.length === 0) {
            console.log('No bones found in the GLB file!');
            console.log('Checking scene structure...');
            gltf.scene.traverse((child) => {
                console.log(`Object: ${child.name} (type: ${child.type})`);
            });
        } else {
            console.log(`Found ${bones.length} bones`);

            // Identify key bones
            const keyBones = identifyKeyBones(bones);

            // Generate and save report
            const report = generateReport(bones, boneHierarchy, keyBones);
            fs.writeFileSync(OUTPUT_FILENAME, report);

            console.log(`\nAnalysis complete! Report saved to: ${OUTPUT_FILENAME}`);
            console.log('\nKey findings:');
            console.log(`- Total bones: ${bones.length}`);
            console.log(`- Root bone: ${keyBones.root || 'NOT FOUND'}`);
            console.log(`- Head bones: ${keyBones.head.join(', ') || 'NOT FOUND'}`);
            console.log(`- Neck bones: ${keyBones.neck.join(', ') || 'NOT FOUND'}`);
            console.log(`- Spine bones: ${keyBones.spine.join(', ') || 'NOT FOUND'}`);
        }

        // Clean up
        if (fs.existsSync(GLB_FILENAME)) {
            fs.unlinkSync(GLB_FILENAME);
            console.log('Temporary GLB file cleaned up.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the analysis
main();