import { WebsimSocket } from '@websim/websim-socket';

// Initialize WebsimSocket with a schema for our patches
const room = new WebsimSocket({
  schema: {
    patches: {
      id: "uuid",
      prompt: "text",
      url: "text",
    },
  },
});

document.addEventListener('DOMContentLoaded', () => {
    const patternInput = document.getElementById('pattern-input');
    const addPatchBtn = document.getElementById('add-patch-btn');
    const robeContainer = document.getElementById('robe-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    // Function to render patches to the DOM
    const renderPatches = (patches) => {
        // Sort patches by creation date, newest first
        const sortedPatches = patches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        robeContainer.innerHTML = ''; // Clear existing patches
        
        sortedPatches.forEach(patch => {
            const patchImage = document.createElement('img');
            patchImage.src = patch.url;
            patchImage.alt = patch.prompt;
            patchImage.title = `${patch.prompt}\n- by ${patch.username}`; // Show prompt and creator on hover
            patchImage.className = 'patch';
            robeContainer.appendChild(patchImage);
        });
    };

    // Function to generate image and create a database record
    const createPatch = async (promptText) => {
        try {
            const prompt = `A seamless, tileable, beautiful fabric texture of: ${promptText}. Photorealistic, high quality.`;
            
            const result = await websim.imageGen({
                prompt: prompt,
                aspect_ratio: "1:1",
            });

            if (result.url) {
                // Create a new patch record in the database
                await room.collection('patches').create({
                    prompt: promptText,
                    url: result.url,
                });
                // The UI will be updated by the subscription
            } else {
                throw new Error('Image generation failed to return a URL.');
            }
        } catch (error) {
            console.error(`Error creating patch for "${promptText}":`, error);
            // Don't show an alert to the user, just log the error.
        }
    };

    // Main handler for adding a new patch from user input
    const handleAddPatchClick = async () => {
        const userInput = patternInput.value.trim();
        if (!userInput) {
            alert('Please describe a pattern for the patch.');
            return;
        }

        // Show loading indicator and disable controls
        loadingIndicator.classList.remove('hidden');
        addPatchBtn.disabled = true;
        patternInput.disabled = true;

        await createPatch(userInput);
        
        patternInput.value = ''; // Clear input

        // Hide loading indicator and re-enable controls
        // The subscription will handle rendering the new patch
        loadingIndicator.classList.add('hidden');
        addPatchBtn.disabled = false;
        patternInput.disabled = false;
        patternInput.focus();
    };

    addPatchBtn.addEventListener('click', handleAddPatchClick);
    patternInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // prevent form submission
            handleAddPatchClick();
        }
    });

    // Function to seed the database with initial patches if it's empty
    const initializeRobe = async () => {
        const existingPatches = await room.collection('patches').getList();

        if (existingPatches.length === 0) {
            loadingIndicator.classList.remove('hidden'); // Show loading while seeding
            loadingIndicator.querySelector('p').textContent = 'Weaving the very first threads...';
            
            const initialPrompts = [
                "shimmering rainbow silk",
                "deep blue velvet with silver stars",
                "golden brocade with floral patterns",
                "forest green wool with leaf veins",
                "sun-bleached linen",
                "vibrant scarlet satin"
            ];
            
            // Create initial patches in parallel.
            // We don't need to manually render, the subscription will catch them.
            await Promise.all(initialPrompts.map(prompt => createPatch(prompt)));
            
            loadingIndicator.classList.add('hidden');
            loadingIndicator.querySelector('p').textContent = 'Weaving your design...'; // Reset text
        }
    };

    // Subscribe to the patches collection for real-time updates
    room.collection('patches').subscribe(renderPatches);

    // Initialize the robe (check for existing patches and seed if necessary)
    initializeRobe();
});