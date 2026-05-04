(function () {
  const QR_API = "https://api.qrserver.com/v1/create-qr-code/";
  const SHARE_TITLE = "三消收集挑战";

  function getShareUrl() {
    const configuredUrl = document.body.dataset.shareUrl;
    if (configuredUrl) {
      return configuredUrl;
    }

    return window.location.href.split("#")[0];
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function createQrUrl(shareUrl) {
    const params = new URLSearchParams({
      size: "240x240",
      margin: "12",
      data: shareUrl,
    });

    return `${QR_API}?${params.toString()}`;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function mountSharePlugin() {
    const shareUrl = getShareUrl();
    const qrUrl = createQrUrl(shareUrl);
    const isLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(shareUrl);

    const trigger = createElement("button", "wechat-share-trigger", "微信扫码分享");
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");

    const overlay = createElement("div", "wechat-share-overlay");
    overlay.hidden = true;

    const dialog = createElement("section", "wechat-share-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "wechatShareTitle");

    const closeButton = createElement("button", "wechat-share-close", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "关闭微信分享弹层");

    const title = createElement("h2", "", "微信扫码分享");
    title.id = "wechatShareTitle";

    const description = createElement(
      "p",
      "wechat-share-description",
      "用微信扫一扫下方二维码，即可打开并分享这个三消游戏。"
    );

    const qrImage = document.createElement("img");
    qrImage.className = "wechat-share-qr";
    qrImage.src = qrUrl;
    qrImage.alt = `${SHARE_TITLE} 分享二维码`;
    qrImage.width = 240;
    qrImage.height = 240;

    const urlText = createElement("p", "wechat-share-url", shareUrl);
    const copyButton = createElement("button", "wechat-share-copy", "复制链接");
    copyButton.type = "button";

    const hint = createElement(
      "p",
      "wechat-share-hint",
      isLocalUrl ? "当前是本地预览地址，手机需能访问这台电脑；部署到线上后二维码会更适合微信分享。" : "二维码内容会随当前页面地址自动更新。"
    );

    dialog.append(closeButton, title, description, qrImage, urlText, copyButton, hint);
    overlay.append(dialog);
    document.body.append(trigger, overlay);

    function openDialog() {
      overlay.hidden = false;
      document.body.classList.add("has-share-dialog");
      closeButton.focus();
    }

    function closeDialog() {
      overlay.hidden = true;
      document.body.classList.remove("has-share-dialog");
      trigger.focus();
    }

    trigger.addEventListener("click", openDialog);
    closeButton.addEventListener("click", closeDialog);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeDialog();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !overlay.hidden) {
        closeDialog();
      }
    });
    copyButton.addEventListener("click", async () => {
      await copyText(shareUrl);
      copyButton.textContent = "已复制";
      window.setTimeout(() => {
        copyButton.textContent = "复制链接";
      }, 1600);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSharePlugin);
  } else {
    mountSharePlugin();
  }
})();
