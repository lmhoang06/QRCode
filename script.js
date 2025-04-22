import { isDuplicateBlock, addBlock } from './utils/storage.js';
import { generateQRCode, debounce, createJsonDownloadLink } from './utils/qrGenerator.js';
import { Notification } from './components/notification.js';
import { logout, getCurrentUser } from './utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    const notification = new Notification();
    notification.init();
    
    // Form elements
    const form = {
        tenKhoi: document.getElementById('tenKhoi'),
        loaiKhoi: document.getElementById('loaiKhoi'),
        canNang: document.getElementById('canNang'),
        donViCanNang: document.getElementById('donViCanNang'),
        chieuDai: document.getElementById('chieuDai'),
        chieuRong: document.getElementById('chieuRong'),
        chieuCao: document.getElementById('chieuCao'),
        chatLieu: document.getElementById('chatLieu'),
        mauSac: document.getElementById('mauSac'),
        colorPicker: document.getElementById('colorPicker'),
        moTa: document.getElementById('moTa')
    };
    
    // UI elements
    const generateQrBtn = document.getElementById('generateQrBtn');
    const errorMessageDiv = document.getElementById('errorMessage');
    const idDisplay = document.getElementById('idDisplay');
    const qrPreview = document.getElementById('qrPreview');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const outputSection = document.getElementById('outputSection');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const newBlockBtn = document.getElementById('newBlockBtn');
    const jsonPreview = document.getElementById('jsonPreview');
    
    // Set up authentication related elements
    const currentUserElement = document.getElementById('currentUser');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUserElement) {
        currentUserElement.textContent = getCurrentUser() || 'Admin';
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                logout();
            }
        });
    }
    
    // State
    let formData = {
        tenKhoi: '',
        loaiKhoi: '',
        canNang: 0,
        donViCanNang: 'g'
    };
    let currentId = Date.now(); // Initial ID for preview
    let currentBlockData = null; // Saved block data
    
    // Update the ID display with current timestamp
    idDisplay.textContent = currentId;
    
    // Sửa phần updateQRPreview để sử dụng hàm generateQRCode mới
    const updateQRPreview = debounce(() => {
        if (isFormValid()) {
            const previewData = collectFormData();
            previewData.id = currentId;
            generateQRCode(qrPreview, previewData);
        } else {
            // Clear preview if form is invalid
            qrPreview.innerHTML = '';
        }
    }, 500);
    
    // Collect data from all form fields
    function collectFormData() {
        const data = {
            tenKhoi: form.tenKhoi.value.trim(),
            loaiKhoi: form.loaiKhoi.value,
            canNang: parseFloat(form.canNang.value) || 0,
            donViCanNang: form.donViCanNang.value,
            kichThuoc: {}
        };
        
        // Add dimensions if provided
        if (form.chieuDai.value) data.kichThuoc.dai = parseFloat(form.chieuDai.value);
        if (form.chieuRong.value) data.kichThuoc.rong = parseFloat(form.chieuRong.value);
        if (form.chieuCao.value) data.kichThuoc.cao = parseFloat(form.chieuCao.value);
        
        // Add material if provided
        if (form.chatLieu.value) data.chatLieu = form.chatLieu.value;
        
        // Add color info if provided
        if (form.mauSac.value || form.colorPicker.value !== '#3498db') {
            data.mauSac = {
                moTa: form.mauSac.value,
                maMau: form.colorPicker.value
            };
        }
        
        // Add description if provided
        if (form.moTa.value.trim()) data.moTa = form.moTa.value.trim();
        
        return data;
    }
    
    // Basic validation
    function isFormValid() {
        const tenKhoi = form.tenKhoi.value.trim();
        const loaiKhoi = form.loaiKhoi.value;
        const canNang = parseFloat(form.canNang.value);
        
        return tenKhoi !== '' && loaiKhoi !== '' && !isNaN(canNang) && canNang > 0;
    }
    
    // Show error message
    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    }
    
    // Hide error message
    function hideError() {
        errorMessageDiv.textContent = '';
        errorMessageDiv.classList.add('hidden');
    }
    
    // Setup form change event listeners
    function setupFormListeners() {
        // Monitor all inputs for QR preview updates
        const inputs = [
            form.tenKhoi, form.loaiKhoi, form.canNang, form.donViCanNang,
            form.chieuDai, form.chieuRong, form.chieuCao, 
            form.chatLieu, form.mauSac, form.colorPicker, form.moTa
        ];
        
        inputs.forEach(input => {
            if (!input) return; // Skip if element doesn't exist
            
            const eventType = input.type === 'color' ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                // Update ID and regenerate preview
                currentId = Date.now();
                idDisplay.textContent = currentId;
                updateQRPreview();
            });
        });
        
        // Color picker special handling to update text field
        if (form.colorPicker && form.mauSac) {
            form.colorPicker.addEventListener('change', () => {
                if (!form.mauSac.value) {
                    const colorHex = form.colorPicker.value;
                    form.mauSac.value = `Mã màu: ${colorHex}`;
                }
            });
        }
    }
    
    // Sửa phần tạo QR code khi submit form
    generateQrBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        hideError();
        
        if (!isFormValid()) {
            if (!form.tenKhoi.value.trim()) {
                showError('Vui lòng nhập Tên khối.');
            } else if (!form.loaiKhoi.value) {
                showError('Vui lòng chọn Loại khối.');
            } else if (isNaN(parseFloat(form.canNang.value)) || parseFloat(form.canNang.value) <= 0) {
                showError('Cân nặng phải là một số thực dương.');
            }
            return;
        }
        
        // Collect all form data
        const blockData = {
            ...collectFormData(),
            id: currentId
        };
        
        // Check for duplicates (only basic fields)
        const basicData = {
            tenKhoi: blockData.tenKhoi,
            loaiKhoi: blockData.loaiKhoi,
            canNang: blockData.canNang
        };
        
        if (await isDuplicateBlock(basicData)) {
            showError('Khối với thông tin này đã tồn tại.');
            return;
        }
        
        try {
            // Save to storage and get back data with ID
            currentBlockData = await addBlock(blockData);
            
            // Update displayed ID
            currentId = currentBlockData.id;
            idDisplay.textContent = currentId;
            
            // Generate QR code with error handling
            console.log('Attempting to create QR code in container:', qrCodeContainer.id);
            
            // Generate QR code using our utility function
            const qrCode = generateQRCode(qrCodeContainer, currentBlockData);
            
            if (qrCode) {
                // Show output section
                outputSection.classList.remove('hidden');
                
                // Display JSON preview
                if (jsonPreview) {
                    jsonPreview.textContent = JSON.stringify(currentBlockData, null, 2);
                }
                
                // Show success notification
                notification.success(`Khối "${currentBlockData.tenKhoi}" đã được lưu thành công!`);
            } else {
                notification.error('Không thể tạo mã QR, vui lòng thử lại');
            }
            
        } catch (error) {
            console.error("Error saving block:", error);
            notification.error("Có lỗi xảy ra khi lưu khối.");
        }
    });
    
    // Download JSON button
    downloadJsonBtn.addEventListener('click', () => {
        if (!currentBlockData) return;
        
        const url = createJsonDownloadLink(currentBlockData);
        const filename = `thong_tin_khoi_${currentBlockData.id}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // New block button
    newBlockBtn.addEventListener('click', () => {
        // Reset form
        Object.values(form).forEach(input => {
            if (!input) return;
            if (input.type === 'color') {
                input.value = '#3498db'; // Reset to default color
            } else {
                input.value = '';
            }
        });
        
        // Reset UI
        currentId = Date.now();
        idDisplay.textContent = currentId;
        outputSection.classList.add('hidden');
        qrPreview.innerHTML = '';
        currentBlockData = null;
        
        // Focus on first field
        form.tenKhoi.focus();
    });
    
    // Initialize event listeners
    setupFormListeners();
    
    // Initialize first QR preview if form is already valid (e.g. after page reload)
    updateQRPreview();
});