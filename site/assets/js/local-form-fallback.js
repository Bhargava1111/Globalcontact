(function () {
  "use strict";

  var primaryEmail = "info@globalcontacthub.com";
  var secondaryEmail = "robert.h@globalcontacthub.com";
  var apiEndpoint = "/api/contact";

  function collectFormData(form) {
    var pairs = [];
    var formData = new FormData(form);

    formData.forEach(function (value, key) {
      var trimmedKey = String(key || "").trim();
      var trimmedValue = String(value || "").trim();

      if (!trimmedKey || !trimmedValue) {
        return;
      }

      pairs.push(trimmedKey + ": " + trimmedValue);
    });

    return pairs;
  }

  function submitToBackend(form) {
    return fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPayload(form)),
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (payload) {
        if (!response.ok) {
          throw new Error(payload && payload.error ? payload.error : "Request failed");
        }
        return payload;
      });
    });
  }

  function buildMailtoUrl(form) {
    var title = document.title || "Website Enquiry";
    var recipients = primaryEmail + "," + secondaryEmail;
    var bodyLines = [
      "New enquiry received from the website.",
      "",
      "Page: " + window.location.href,
      "",
    ].concat(collectFormData(form));

    return (
      "mailto:" +
      recipients +
      "?subject=" +
      encodeURIComponent(title + " enquiry") +
      "&body=" +
      encodeURIComponent(bodyLines.join("\n"))
    );
  }

  function buildPayload(form) {
    var payload = {
      pageUrl: window.location.href,
      pageTitle: document.title || "Website Enquiry",
      fields: {},
    };
    var formData = new FormData(form);

    formData.forEach(function (value, key) {
      var trimmedKey = String(key || "").trim();
      var trimmedValue = String(value || "").trim();
      if (!trimmedKey || !trimmedValue) {
        return;
      }
      payload.fields[trimmedKey] = trimmedValue;
    });

    return payload;
  }

  function isLocalCloneForm(form) {
    if (!form) {
      return false;
    }

    var action = (form.getAttribute("action") || "").toLowerCase();
    return (
      form.classList.contains("contact-form") ||
      form.classList.contains("php-email-form") ||
      action.indexOf("send_email.php") !== -1 ||
      action.indexOf("forms/contact.php") !== -1 ||
      action === "#local-form-handler"
    );
  }

  function getFeedbackTarget(form) {
    return (
      form.querySelector(".local-form-feedback") ||
      form.parentElement.querySelector(".local-form-feedback")
    );
  }

  function ensureFeedbackNode(form) {
    var existing = getFeedbackTarget(form);
    if (existing) {
      return existing;
    }

    var node = document.createElement("div");
    node.className = "local-form-feedback";
    node.setAttribute("role", "status");
    node.style.marginTop = "12px";
    node.style.padding = "12px 16px";
    node.style.borderRadius = "10px";
    node.style.fontSize = "14px";
    node.style.lineHeight = "1.5";
    node.style.background = "#e8f7ee";
    node.style.color = "#13653b";
    node.style.border = "1px solid #b9e5c8";
    node.style.display = "none";
    form.insertAdjacentElement("afterend", node);
    return node;
  }

  function setFeedback(form, message, isError) {
    var node = ensureFeedbackNode(form);
    node.textContent = message;
    node.style.display = "block";
    node.style.background = isError ? "#fdeaea" : "#e8f7ee";
    node.style.color = isError ? "#8c1d1d" : "#13653b";
    node.style.borderColor = isError ? "#f1c1c1" : "#b9e5c8";
  }

  document.addEventListener(
    "submit",
    function (event) {
      var form = event.target;
      if (!isLocalCloneForm(form)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!form.checkValidity()) {
        setFeedback(form, "Please complete the required fields before submitting.", true);
        form.reportValidity();
        return;
      }

      setFeedback(form, "Sending your enquiry...", false);

      submitToBackend(form)
        .then(function () {
          setFeedback(
            form,
            "Your enquiry was sent successfully to info@globalcontacthub.com and robert.h@globalcontacthub.com.",
            false,
          );

          if (typeof form.reset === "function") {
            form.reset();
          }

          var successPopup = form.parentElement.querySelector("#successPopup");
          if (successPopup) {
            successPopup.style.display = "block";
            window.setTimeout(function () {
              successPopup.style.display = "none";
            }, 3000);
          }
        })
        .catch(function (error) {
          var reason = error && error.message ? " (" + error.message + ")" : "";
          setFeedback(
            form,
            "Automatic sending is unavailable right now" + reason + ". Your email app is opening with the enquiry filled in.",
            true,
          );
          window.location.href = buildMailtoUrl(form);
        });
    },
    true,
  );
})();
