let selectedFiles = {
    archive: [],
    extract: ''
};

let outputPaths = {
    extract: ''
};

function updateFileList(type) {
    const fileList = document.getElementById(`${type}FileList`);
    fileList.innerHTML = '';

    if (type === 'archive') {
        selectedFiles.archive.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${window.api.getBasename(file)}</span>
                <button onclick="removeFile('archive', ${index})">×</button>
            `;
            fileList.appendChild(fileItem);
        });
    } else {
        if (selectedFiles.extract) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${window.api.getBasename(selectedFiles.extract)}</span>
                <button onclick="removeFile('extract')">×</button>
            `;
            fileList.appendChild(fileItem);
        }
    }
}

function removeFile(type, index) {
    if (type === 'archive') {
        selectedFiles.archive.splice(index, 1);
    } else {
        selectedFiles.extract = '';
    }
    updateFileList(type);
}

async function selectFiles(type) {
    if (document.querySelector('.section').classList.contains('loading')) {
        return;
    }
    
    const files = await window.api.selectFiles(type);
    if (files && files.length > 0) {
        if (type === 'archive') {
            selectedFiles.archive = files;
        } else {
            selectedFiles.extract = files[0];
        }
        updateFileList(type);
    }
}

async function archive() {
    if (!selectedFiles.archive.length) {
        showStatus('Please select files to archive', false);
        return;
    }

    try {
        setLoading(true);

        const password = document.getElementById('archivePassword').value;
        const format = document.getElementById('archiveFormat').value;
        const customName = document.getElementById('customName').value.trim();
        
        const result = await window.api.createArchive({
            input: selectedFiles.archive,
            password,
            format,
            customName
        });

        showStatus(result.message, result.success);
        if (result.success) {
            selectedFiles.archive = [];
            document.getElementById('archivePassword').value = '';
            document.getElementById('customName').value = '';
            updateFileList('archive');
        }
    } catch (error) {
        showStatus('An error occurred during archiving', false);
        console.error(error);
    } finally {
        setLoading(false);
    }
}

function showStatus(message, success) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${success ? 'success' : 'error'}`;
    
    // Clear any existing timeout
    if (window.statusTimeout) {
        clearTimeout(window.statusTimeout);
    }
    
    // Set new timeout
    window.statusTimeout = setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
    }, 5000);
}

async function checkInstallation() {
    const isInstalled = await window.api.check7ZipInstallation();
    const warningDiv = document.getElementById('installationWarning');
    if (!isInstalled) {
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', checkInstallation);

function setLoading(isLoading) {
    const archiveSection = document.querySelector('.section');
    const spinner = document.getElementById('archiveSpinner');
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input, select');

    if (isLoading) {
        archiveSection.classList.add('loading');
        spinner.style.display = 'block';
        buttons.forEach(button => button.disabled = true);
        inputs.forEach(input => input.disabled = true);
    } else {
        archiveSection.classList.remove('loading');
        spinner.style.display = 'none';
        buttons.forEach(button => button.disabled = false);
        inputs.forEach(input => input.disabled = false);
    }
}