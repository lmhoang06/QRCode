/**
 * Form component for user input
 */
import { addBlock, isDuplicateBlock } from '../utils/storage.js';
import { debounce, generateQRCode } from '../utils/qrGenerator.js';

export class BlockForm {
    constructor() {
        this.formData = {
            tenKhoi: '',
            loaiKhoi: '',
            canNang: 0
        };
        this.currentId = null;
        this.onDataChange = null;
        this.debounceTime = 500; // ms
    }
    
    init() {
        this.tenKhoiInput = document.getElementById('tenKhoi');
        this.loaiKhoiSelect = document.getElementById('loaiKhoi');
        this.canNangInput = document.getElementById('canNang');
        this.generateQrBtn = document.getElementById('generateQrBtn');
        this.errorMessageDiv = document.getElementById('errorMessage');
        this.idDisplay = document.getElementById('idDisplay');
        this.qrPreviewContainer = document.getElementById('qrPreview');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Real-time update events
        this.tenKhoiInput.addEventListener('input', this.handleInputChange.bind(this));
        this.loaiKhoiSelect.addEventListener('change', this.handleInputChange.bind(this));
        this.canNangInput.addEventListener('input', this.handleInputChange.bind(this));
        
        // Submit button
        this.generateQrBtn.addEventListener('click', this.handleSubmit.bind(this));
        
        // Setup debounced QR preview
        this.updateQRPreview = debounce(() => {
            if (this.isFormValid()) {
                const previewData = { ...this.formData, id: this.currentId || 'preview' };
                generateQRCode(this.qrPreviewContainer, previewData);
            }
        }, this.debounceTime);
    }
    
    handleInputChange(e) {
        const { id, value } = e.target;
        
        // Update form data
        if (id === 'tenKhoi') {
            this.formData.tenKhoi = value.trim();
        } else if (id === 'loaiKhoi') {
            this.formData.loaiKhoi = value;
        } else if (id === 'canNang') {
            this.formData.canNang = parseFloat(value) || 0;
        }
        
        // Generate temporary ID for preview
        this.currentId = Date.now();
        if (this.idDisplay) {
            this.idDisplay.textContent = this.currentId;
        }
        
        // Update QR preview if form is valid
        this.updateQRPreview();
        
        // Call callback if defined
        if (typeof this.onDataChange === 'function') {
            this.onDataChange(this.formData);
        }
    }
    
    isFormValid() {
        if (!this.formData.tenKhoi) {
            return false;
        }
        if (!this.formData.loaiKhoi) {
            return false;
        }
        if (isNaN(this.formData.canNang) || this.formData.canNang <= 0) {
            return false;
        }
        return true;
    }
    
    showError(message) {
        this.errorMessageDiv.textContent = message;
        this.errorMessageDiv.classList.remove('hidden');
    }
    
    hideError() {
        this.errorMessageDiv.textContent = '';
        this.errorMessageDiv.classList.add('hidden');
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        this.hideError();
        
        if (!this.isFormValid()) {
            if (!this.formData.tenKhoi) {
                this.showError('Vui lòng nhập Tên khối.');
            } else if (!this.formData.loaiKhoi) {
                this.showError('Vui lòng chọn Loại khối.');
            } else if (isNaN(this.formData.canNang) || this.formData.canNang <= 0) {
                this.showError('Cân nặng phải là một số thực dương.');
            }
            return;
        }
        
        // Check for duplicates
        if (await isDuplicateBlock(this.formData)) {
            this.showError('Khối với thông tin này đã tồn tại.');
            return;
        }
        
        // Add block and get back the data with ID
        const savedBlock = await addBlock(this.formData);
        
        // Update ID display with permanent ID
        this.currentId = savedBlock.id;
        if (this.idDisplay) {
            this.idDisplay.textContent = this.currentId;
        }
        
        // Trigger success event
        const event = new CustomEvent('block-saved', { detail: savedBlock });
        document.dispatchEvent(event);
    }
}
