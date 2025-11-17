    function composeMessage() {
      const name = (document.getElementById("userName").value || "").trim();
      const message = (document.getElementById("userMessage").value || "").trim();
      return { name, message, full: name && message ? `Hi, I'm ${name}. ${message}` : "" };
    }

    document.getElementById("btnWhatsapp").addEventListener("click", () => {
      const { name, message, full } = composeMessage();
      if (!name || !message) return alert("Please fill in both your name and message.");
      const url = `https://wa.me/8801788481222?text=${encodeURIComponent(full)}`;
      window.open(url, "_blank", "noopener");
    });


    document.getElementById("btnCopy").addEventListener("click", async () => {
      const { name, message, full } = composeMessage();
      if (!name || !message) return alert("Please fill in both your name and message.");
      try {
        await navigator.clipboard.writeText(full);
        alert("Message copied to clipboard.");
      } catch {
        const t = document.createElement("textarea");
        t.value = full;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        document.body.removeChild(t);
        alert("Message copied to clipboard.");
      }
    });