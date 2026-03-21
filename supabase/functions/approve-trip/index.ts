// ... keep imports at top ...

// 3. SEND THE EMAIL (FIXED URL AND SENDER)
let emailSent = false;
if (resendApiKey && agentEmail) {
  try {
    const emailResp = await fetch("https://api.resend.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Updates @ Journeys with Joi <updates@updates.journeyswithjoi.com>",
        to: [agentEmail],
        reply_to: agentEmail,
        subject: `Trip Approved: ${tripName} - ${travelerName}`,
        html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0c7d69;">New Approval Received!</h2>
                <p><strong>Traveler:</strong> ${travelerName}</p>
                <p><strong>Trip:</strong> ${tripName}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p><strong>Selections:</strong><br/>${selectionSummary || "Standard package selected."}</p>
                <p><strong>Final Total:</strong> $${totalPrice || 0}</p>
                <p><strong>Deposit Due:</strong> $${deposit}</p>
                <br/>
                <a href="https://studio.journeyswithjoi.com{trip.public_slug}" style="display: inline-block; background-color: #0c7d69; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Proposal Snapshot</a>
              </div>
            `,
      }),
    });

    const resendData = await emailResp.json();
    console.log("Resend API Response:", resendData);
    emailSent = emailResp.ok;
  } catch (err) {
    console.error("Email fetch failed:", err);
  }
}
// ... keep return at bottom ...
