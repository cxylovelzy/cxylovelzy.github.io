document.addEventListener('DOMContentLoaded', function() {

    const langTexts = {
        zh: {
            dialogText: "此页面受密码保护。",
            passwordPrompt: "密码",
            hint: "提示: ",
            invalidPass: "抱歉，请重试。",
            trycatcherror: "抱歉，出现错误。",
            success: "成功！",
            securecontext: "抱歉，密码保护仅在安全连接上有效。请通过HTTPS加载此页面。",
            nocrypto: "您的浏览器似乎已过时。请使用现代浏览器访问此页面。",
            toggleLanguage: "中文/Eng",
            submitPass: "提交"
        },
        en: {
            dialogText: "This page is password protected.",
            passwordPrompt: "Password",
            hint: "Hint: ",
            invalidPass: "Sorry, please try again.",
            trycatcherror: "Sorry, something went wrong.",
            success: "Success!",
            securecontext: "Sorry, but password protection only works over a secure connection. Please load this page via HTTPS.",
            nocrypto: "Your web browser appears to be outdated. Please visit this page using a modern browser.",
            toggleLanguage: "中文/Eng",
            submitPass: "Submit"
        }
        
    };

    let currentLang = 'en'; // 默认语言为英文

    function updateTexts(lang) {
        document.getElementById('dialogText').textContent = langTexts[lang].dialogText;
        document.getElementById('passwordPrompt').textContent = langTexts[lang].passwordPrompt;
        document.getElementById('hint').textContent = langTexts[lang].hint;
        document.getElementById('invalidPass').textContent = langTexts[lang].invalidPass;
        document.getElementById('trycatcherror').textContent = langTexts[lang].trycatcherror;
        document.getElementById('success').textContent = langTexts[lang].success;
        document.getElementById('securecontext').textContent = langTexts[lang].securecontext;
        document.getElementById('nocrypto').textContent = langTexts[lang].nocrypto;
        document.getElementById('toggleLanguage').textContent = langTexts[lang].toggleLanguage;
        document.getElementById('submitPass').textContent = langTexts[lang].submitPass;
    }

    function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        updateTexts(currentLang);
    }

    document.getElementById('toggleLanguage').addEventListener('click', toggleLanguage);

    // 初始化文本
    updateTexts(currentLang);
});

document.addEventListener('DOMContentLoaded', function() {
    var pl = window.pl

    var submitPass = document.getElementById('submitPass');
    var passEl = document.getElementById('pass');
    var invalidPassEl = document.getElementById('invalidPass');
    var trycatcherror = document.getElementById('trycatcherror');
    var successEl = document.getElementById('success');
    var contentFrame = document.getElementById('contentFrame');
    
    // Sanity checks

    if (pl === "") {
        submitPass.disabled = true;
        passEl.disabled = true;
        alert("This page is meant to be used with the encryption tool. It doesn't work standalone.");
        return;
    }

    if (!isSecureContext) {
        document.querySelector("#passArea").style.display = "none";
        document.querySelector("#securecontext").style.display = "block";
        return;
    }

    if (!crypto.subtle) {
        document.querySelector("#passArea").style.display = "none";
        document.querySelector("#nocrypto").style.display = "block";
        return;
    }
    
    function str2ab(str) {
        var ustr = atob(str);
        var buf = new ArrayBuffer(ustr.length);
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=ustr.length; i < strLen; i++) {
            bufView[i] = ustr.charCodeAt(i);
        }
        return bufView;
    }

    async function deriveKey(salt, password) {
        const encoder = new TextEncoder()
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey'],
        )
        return await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['decrypt'],
        )
    }
    
    async function doSubmit(evt) {
        submitPass.disabled = true;
        passEl.disabled = true;

        let iv, ciphertext, key;
        
        try {
            var unencodedPl = str2ab(pl);

            const salt = unencodedPl.slice(0, 32)
            iv = unencodedPl.slice(32, 32 + 16)
            ciphertext = unencodedPl.slice(32 + 16)

            key = await deriveKey(salt, passEl.value);
        } catch (e) {
            trycatcherror.style.display = "inline";
            console.error(e);
            return;
        }

        try {
            const decryptedArray = new Uint8Array(
                await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
            );

            let decrypted = new TextDecoder().decode(decryptedArray);

            if (decrypted === "") throw "No data returned";

            const basestr = '<base href="." target="_top">';
            const anchorfixstr = `
                <script>
                    Array.from(document.links).forEach((anchor) => {
                        const href = anchor.getAttribute("href");
                        if (href.startsWith("#")) {
                            anchor.addEventListener("click", function(e) {
                                e.preventDefault();
                                const targetId = this.getAttribute("href").substring(1);
                                const targetEl = document.getElementById(targetId);
                                targetEl.scrollIntoView();
                            });
                        }
                    });
                <\/script>
            `;
            
            // Set default iframe link targets to _top so all links break out of the iframe
            if (decrypted.includes("<head>")) decrypted = decrypted.replace("<head>", "<head>" + basestr);
            else if (decrypted.includes("<!DOCTYPE html>")) decrypted = decrypted.replace("<!DOCTYPE html>", "<!DOCTYPE html>" + basestr);
            else decrypted = basestr + decrypted;

            // Fix fragment links
            if (decrypted.includes("</body>")) decrypted = decrypted.replace("</body>", anchorfixstr + '</body>');
            else if (decrypted.includes("</html>")) decrypted = decrypted.replace("</html>", anchorfixstr + '</html>');
            else decrypted = decrypted + anchorfixstr;
            
            contentFrame.srcdoc = decrypted;
            
            successEl.style.display = "inline";
            setTimeout(function() {
                dialogWrap.style.display = "none";
            }, 1000);
        } catch (e) {
            invalidPassEl.style.display = "inline";
            passEl.value = "";
            submitPass.disabled = false;
            passEl.disabled = false;
            console.error(e);
            return;
        }
    }
    
    submitPass.onclick = doSubmit;
    passEl.onkeypress = function(e){
        if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        invalidPassEl.style.display = "none";
        if (keyCode == '13'){
          // Enter pressed
          doSubmit();
          return false;
        }
    }
});