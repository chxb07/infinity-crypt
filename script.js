document.addEventListener('DOMContentLoaded', function () {
    // Form toggle buttons
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleIndicator = document.querySelector('.toggle-indicator');

    btnLogin.addEventListener('click', function () {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        btnLogin.classList.add('active');
        btnRegister.classList.remove('active');
        toggleIndicator.style.transform = 'translateX(0)';
        addTerminalMessage("> Login interface activated");
    });

    btnRegister.addEventListener('click', function () {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        btnRegister.classList.add('active');
        btnLogin.classList.remove('active');
        toggleIndicator.style.transform = 'translateX(100%)';
        addTerminalMessage("> Registration protocol initiated");
    });

    function addTerminalMessage(message) {
        const terminal = document.getElementById('terminal-output');
        const p = document.createElement('p');
        p.innerHTML = message;
        terminal.appendChild(p);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Simple UTF-8 encryption for text
    function simpleEncrypt(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data[i] + 3);
        }
        return btoa(result);
    }

    function simpleDecrypt(encryptedText) {
        try {
            const decoded = atob(encryptedText);
            const bytes = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) {
                bytes[i] = decoded.charCodeAt(i) - 3;
            }
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        } catch (error) {
            console.error("Decryption failed:", error);
            return null;
        }
    }

    // AES-GCM Key for file encryption
    let cryptoKey;

    async function generateCryptoKey() {
        cryptoKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptFile(buffer) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            buffer
        );
        const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.byteLength);
        return combined;
    }

    async function decryptFile(buffer) {
        const iv = buffer.slice(0, 12);
        const encrypted = buffer.slice(12);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            encrypted
        );
        return new Uint8Array(decrypted);
    }

    // Registration
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm').value.trim();
        const securityAnswer = document.getElementById('register-security-question').value.trim();

        if (password !== confirmPassword) {
            addTerminalMessage("> Error: Password mismatch detected");
            return;
        }

        if (!securityAnswer) {
            addTerminalMessage("> Error: Security answer required");
            return;
        }

        const encryptedPassword = simpleEncrypt(password);
        const encryptedAnswer = simpleEncrypt(securityAnswer);

        const userData = {
            username,
            password: encryptedPassword,
            securityAnswer: encryptedAnswer,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('neocrypt_user_' + username, JSON.stringify(userData));

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "neocrypt_identity_" + username + ".ncrypt");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        addTerminalMessage("> User identity created: " + username);
        addTerminalMessage("> Security token saved to local storage");
        addTerminalMessage("> Identity file downloaded to your device");

        btnLogin.click();
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = '';
        registerForm.reset();
    });

    // Login
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const storedData = localStorage.getItem('neocrypt_user_' + username);

        if (!storedData) {
            addTerminalMessage("> Error: User not found");
            return;
        }

        const userData = JSON.parse(storedData);
        const decryptedPassword = simpleDecrypt(userData.password);

        if (password === decryptedPassword) {
            await generateCryptoKey(); // generate encryption key when login
            addTerminalMessage("> Identity verified: " + username);
            addTerminalMessage("> Quantum encryption handshake complete");
            addTerminalMessage("> Welcome to NeoCrypt 2050");

            document.querySelector('.neon-button').classList.add('success');

            setTimeout(() => {
                document.querySelector('.auth-container').classList.add('hidden');
                document.querySelector('.crypto-terminal').classList.add('hidden');
                document.getElementById('crypto-tools-page').classList.remove('hidden');

                const oldMsg = document.querySelector('.welcome-message');
                if (oldMsg) oldMsg.remove();

                const welcomeMessage = `
                    <div class="welcome-message">
                        <h3>Welcome, <span class="neon-blue">${username}</span></h3>
                        <p>Quantum encryption protocols activated</p>
                        <p>Current session: ${new Date().toLocaleString()}</p>
                    </div>
                `;
                document.querySelector('.crypto-header').insertAdjacentHTML('afterend', welcomeMessage);
            }, 2000);
        } else {
            addTerminalMessage("> Error: Invalid credentials");
        }
    });

    // Forgot credentials
    document.getElementById('forgot-link').addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.remove('active');
        document.getElementById('reset-password-page').classList.remove('hidden');
        document.getElementById('reset-password-page').classList.add('active');
    });

    document.getElementById('reset-submit').addEventListener('click', function () {
        const username = document.getElementById('reset-username').value.trim();
        const answer = document.getElementById('reset-security-answer').value.trim();
        const newPassword = document.getElementById('reset-new-password').value.trim();
        const storedData = localStorage.getItem('neocrypt_user_' + username);

        if (!storedData) {
            alert("User not found.");
            addTerminalMessage("> Error: User not found in database");
            return;
        }

        const userData = JSON.parse(storedData);
        const decryptedAnswer = simpleDecrypt(userData.securityAnswer);

        if (decryptedAnswer !== answer) {
            alert("Security answer incorrect.");
            addTerminalMessage("> Error: Security answer verification failed");
            return;
        }

        userData.password = simpleEncrypt(newPassword);
        localStorage.setItem('neocrypt_user_' + username, JSON.stringify(userData));

        alert("Password has been reset successfully.");
        addTerminalMessage("> Password reset successful for user: " + username);

        document.getElementById('reset-password-page').classList.remove('active');
        document.getElementById('reset-password-page').classList.add('hidden');
        document.querySelector('.auth-container').classList.remove('hidden');
        document.querySelector('.crypto-terminal').classList.remove('hidden');
        btnLogin.click();
    });

    // Crypto tool handlers
    function setupCryptoTools() {
        document.getElementById('encrypt-btn').addEventListener('click', function () {
            const data = document.getElementById('data-to-encrypt').value;
            if (!data.trim()) {
                alert("Please enter data to encrypt");
                return;
            }

            const encryptedData = simpleEncrypt(data);
            const resultDiv = document.getElementById('encrypted-result');
            resultDiv.innerHTML = `
                <p><strong>Encrypted Data:</strong></p>
                <div class="encrypted-data">${encryptedData}</div>
                <button class="copy-btn" onclick="copyToClipboard('${encryptedData}')">Copy to Clipboard</button>
            `;
        });

        document.getElementById('decrypt-btn').addEventListener('click', function () {
            const data = document.getElementById('data-to-decrypt').value;
            if (!data.trim()) {
                alert("Please enter data to decrypt");
                return;
            }

            const decryptedData = simpleDecrypt(data);
            const resultDiv = document.getElementById('decrypted-result');

            if (decryptedData) {
                resultDiv.innerHTML = `
                    <p><strong>Decrypted Data:</strong></p>
                    <div class="decrypted-data">${decryptedData}</div>
                    <button class="copy-btn" onclick="copyToClipboard('${decryptedData}')">Copy to Clipboard</button>
                `;
            } else {
                alert("Decryption failed. Please check your encrypted data.");
            }
        });

        document.getElementById('logout-btn').addEventListener('click', function () {
            document.getElementById('crypto-tools-page').classList.add('hidden');
            document.querySelector('.auth-container').classList.remove('hidden');
            document.querySelector('.crypto-terminal').classList.remove('hidden');
            document.getElementById('login-form').reset();
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) welcomeMsg.remove();
            addTerminalMessage("> Session terminated");
            addTerminalMessage("> Ready for new authentication");
        });

        // File Encryption
        document.getElementById('encrypt-file-btn').addEventListener('click', async () => {
            const fileInput = document.getElementById('file-to-encrypt');
            const file = fileInput.files[0];
            if (!file) return alert("Select a file to encrypt.");
            const reader = new FileReader();
            reader.onload = async function () {
                const buffer = reader.result;
                const encrypted = await encryptFile(buffer);
                const blob = new Blob([encrypted]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name + ".encrypted";
                a.click();
                URL.revokeObjectURL(url);
            };
            reader.readAsArrayBuffer(file);
        });

        // File Decryption
        document.getElementById('decrypt-file-btn').addEventListener('click', async () => {
            const fileInput = document.getElementById('file-to-decrypt');
            const file = fileInput.files[0];
            if (!file) return alert("Select a file to decrypt.");
            const reader = new FileReader();
            reader.onload = async function () {
                const buffer = new Uint8Array(reader.result);
                try {
                    const decrypted = await decryptFile(buffer);
                    const blob = new Blob([decrypted]);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name.replace(".encrypted", ".decrypted");
                    a.click();
                    URL.revokeObjectURL(url);
                } catch (e) {
                    alert("Decryption failed. Wrong key?");
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    window.copyToClipboard = function (text) {
        navigator.clipboard.writeText(text).then(() => {
            const buttons = document.querySelectorAll('.copy-btn');
            buttons.forEach(btn => {
                if (btn.textContent.includes('Copy')) {
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = 'Copy to Clipboard';
                    }, 2000);
                }
            });
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    setupCryptoTools();

    setTimeout(() => addTerminalMessage("> Scanning biometric signature..."), 1000);
    setTimeout(() => addTerminalMessage("> Quantum connection established"), 2500);
    setTimeout(() => addTerminalMessage("> Ready for user authentication"), 4000);

    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 2}s`;
    });
});


