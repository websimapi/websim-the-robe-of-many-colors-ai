document.addEventListener('DOMContentLoaded', () => {
    const patternInput = document.getElementById('pattern-input');
    const addPatchBtn = document.getElementById('add-patch-btn');
    const robeContainer = document.getElementById('robe-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    const generateAndAppendPatch = async (promptText) => {
        try {
            const prompt = `A seamless, tileable, beautiful fabric texture of: ${promptText}. Photorealistic, high quality.`;
            
            const result = await websim.imageGen({
                prompt: prompt,
                aspect_ratio: "1:1",
            });

            if (result.url) {
                const patchImage = document.createElement('img');
                patchImage.src = result.url;
                patchImage.alt = promptText;
                patchImage.title = promptText;
                patchImage.className = 'patch';
                // Add to the beginning of the robe
                robeContainer.prepend(patchImage);
            } else {
                throw new Error('Image generation failed to return a URL.');
            }
        } catch (error) {
            console.error(`Error generating patch for "${promptText}":`, error);
            // Don't show an alert to the user, just log the error.
        }
    };

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

        await generateAndAppendPatch(userInput);
        
        patternInput.value = ''; // Clear input

        // Hide loading indicator and re-enable controls
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

    const addInitialPatches = () => {
        const initialPrompts = [
            "shimmering rainbow silk",
            "deep blue velvet with silver stars",
            "golden brocade with floral patterns",
            "forest green wool with leaf veins",
            "sun-bleached linen",
            "vibrant scarlet satin"
        ];
        
        // Generate initial patches in parallel
        Promise.all(initialPrompts.map(prompt => generateAndAppendPatch(prompt)));
    };

    // Make loading indicator hidden by default, but reserve space
    loadingIndicator.classList.add('hidden');
    addInitialPatches();

});

