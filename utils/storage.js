/**
 * Storage utility functions for QR block data
 */

// API base URL
// const API_BASE_URL = 'https://guides.viegrand.site/api2/api';
const API_BASE_URL = 'https://waiedu-backend-a7b30a59c299.herokuapp.com'; // Production URL
// const API_BASE_URL = 'http://localhost:5000'; // Localhost for development

// Fallback to localStorage if API is unavailable
let useLocalStorage = false;
let storageInitialized = false;

// Check if API is available
async function checkApiAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        console.error("API unavailable, falling back to localStorage:", error);
        return false;
    }
}

// Initialize storage
(async function() {
    try {
        useLocalStorage = !(await checkApiAvailability());
        console.log(`Using ${useLocalStorage ? 'localStorage' : 'API'} for storage`);
        storageInitialized = true;
    } catch (error) {
        console.error("Error during storage initialization:", error);
        useLocalStorage = true; // Default to localStorage on error
        storageInitialized = true;
    }
})();

// Check if initialization is complete
export function isStorageInitialized() {
    return storageInitialized;
}

// Retrieve blocks data from API or localStorage
export async function getBlocksData() {
    if (useLocalStorage) {
        return getBlocksFromLocalStorage();
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching blocks from API:", error);
        // Fall back to localStorage if API fails
        return getBlocksFromLocalStorage();
    }
}

// Save blocks data to API or localStorage
export async function saveBlocksData(blocksArray) {
    if (useLocalStorage) {
        return saveBlocksToLocalStorage(blocksArray);
    }
    
    // This function is not directly used with API since we use create/update/delete instead
    console.warn("saveBlocksData is not used with API directly");
    return blocksArray;
}

// Check if block already exists in storage
export async function isDuplicateBlock(newBlock) {
    const existingBlocks = await getBlocksData();
    return existingBlocks.some(block => 
        block.tenKhoi === newBlock.tenKhoi &&
        block.loaiKhoi === newBlock.loaiKhoi &&
        block.canNang === newBlock.canNang
    );
}

// Add new block to storage
export async function addBlock(blockData) {
    if (useLocalStorage) {
        const existingBlocks = getBlocksFromLocalStorage();
        const newBlockWithId = {
            ...blockData,
            id: Date.now()
        };
        
        existingBlocks.push(newBlockWithId);
        saveBlocksToLocalStorage(existingBlocks);
        return newBlockWithId;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blockData)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error adding block to API:", error);
        
        // Fall back to localStorage if API fails
        const existingBlocks = getBlocksFromLocalStorage();
        const newBlockWithId = {
            ...blockData,
            id: Date.now()
        };
        
        existingBlocks.push(newBlockWithId);
        saveBlocksToLocalStorage(existingBlocks);
        return newBlockWithId;
    }
}

// Update block in storage
export async function updateBlock(blockData) {
    if (!blockData.id) {
        throw new Error("Block ID is required for update");
    }
    
    if (useLocalStorage) {
        return updateBlockInLocalStorage(blockData);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blockData)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error updating block in API:", error);
        // Fall back to localStorage
        return updateBlockInLocalStorage(blockData);
    }
}

// Delete block from storage
export async function deleteBlock(blockId) {
    if (useLocalStorage) {
        return deleteBlockFromLocalStorage(blockId);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: blockId })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error deleting block from API:", error);
        // Fall back to localStorage
        return deleteBlockFromLocalStorage(blockId);
    }
}

// Delete multiple blocks
export async function deleteMultipleBlocks(blockIds) {
    if (useLocalStorage) {
        return deleteMultipleBlocksFromLocalStorage(blockIds);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/blocks/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: blockIds })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error deleting multiple blocks from API:", error);
        // Fall back to localStorage
        return deleteMultipleBlocksFromLocalStorage(blockIds);
    }
}

// ----- localStorage fallback functions -----

// Get blocks from localStorage
function getBlocksFromLocalStorage() {
    const data = localStorage.getItem('qrBlocksData');
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error parsing localStorage data:", e);
        return []; 
    }
}

// Save blocks to localStorage
function saveBlocksToLocalStorage(blocksArray) {
    localStorage.setItem('qrBlocksData', JSON.stringify(blocksArray));
    return blocksArray;
}

// Update block in localStorage
function updateBlockInLocalStorage(blockData) {
    const blocks = getBlocksFromLocalStorage();
    const index = blocks.findIndex(block => block.id === blockData.id);
    
    if (index === -1) {
        throw new Error("Block not found");
    }
    
    blocks[index] = blockData;
    saveBlocksToLocalStorage(blocks);
    return blockData;
}

// Delete block from localStorage
function deleteBlockFromLocalStorage(blockId) {
    const blocks = getBlocksFromLocalStorage();
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    saveBlocksToLocalStorage(updatedBlocks);
    return { success: true, message: 'Block deleted' };
}

// Delete multiple blocks from localStorage
function deleteMultipleBlocksFromLocalStorage(blockIds) {
    const blocks = getBlocksFromLocalStorage();
    const updatedBlocks = blocks.filter(block => !blockIds.includes(block.id));
    saveBlocksToLocalStorage(updatedBlocks);
    return { success: true, message: 'Blocks deleted', count: blockIds.length };
}
