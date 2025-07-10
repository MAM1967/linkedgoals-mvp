import * as admin from "firebase-admin";
import { EmailService } from "./emailService";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const emailTemplates = {
  email_verification: {
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .verification-section { text-align: center; margin: 30px 0; }
        .verify-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
            color: white; 
            padding: 15px 40px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: 600; 
            margin: 20px 0; 
        }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        .support-link { color: #0066cc; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{appName}}</h1>
        </div>
        <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Welcome to LinkedGoals! We're excited to have you on board.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            
            <div class="verification-section">
                <a href="{{verificationUrl}}" class="verify-button">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in 24 hours for security purposes.</p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px;">{{verificationUrl}}</p>
            
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:{{supportEmail}}" class="support-link">{{supportEmail}}</a></p>
            <p>&copy; 2024 LinkedGoals. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textContent: `Hi {{userName}},

Welcome to {{appName}}! 

To verify your email address, please visit: {{verificationUrl}}

This link will expire in 24 hours.

If you didn't create an account with us, you can ignore this email.

Need help? Contact us at {{supportEmail}}

© 2024 LinkedGoals. All rights reserved.`,
  },

  welcome: {
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LinkedGoals</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: 600; 
            margin: 20px 0; 
        }
        .features { margin: 30px 0; }
        .feature { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        .support-link { color: #0066cc; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Welcome to LinkedGoals!</h1>
        </div>
        <div class="content">
            <h2>Hi {{userName}},</h2>
            <p>Congratulations on taking the first step toward achieving your professional goals! We're thrilled to have you join the LinkedGoals community.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}" class="cta-button">Go to Your Dashboard</a>
            </div>
            
            <div class="features">
                <h3>Here's what you can do with LinkedGoals:</h3>
                <div class="feature">
                    <strong>📊 Track Progress:</strong> Set SMART goals and monitor your progress with detailed analytics
                </div>
                <div class="feature">
                    <strong>💡 Get Insights:</strong> Receive personalized recommendations to stay on track
                </div>
                <div class="feature">
                    <strong>🔗 LinkedIn Integration:</strong> Connect your professional network to your goals
                </div>
                <div class="feature">
                    <strong>📈 Weekly Updates:</strong> Get progress reports delivered to your inbox
                </div>
            </div>
            
            <p>Ready to get started? Head to your dashboard and create your first goal!</p>
            
            <p>If you have any questions, our support team is here to help.</p>
        </div>
        <div class="footer">
            <p>Need help? Visit our <a href="{{helpUrl}}" class="support-link">Help Center</a> or contact <a href="mailto:{{supportEmail}}" class="support-link">{{supportEmail}}</a></p>
            <p>&copy; 2024 LinkedGoals. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    textContent: `Hi {{userName}},

Welcome to LinkedGoals! 🎯

Congratulations on taking the first step toward achieving your professional goals!

Here's what you can do:
- 📊 Track Progress: Set SMART goals and monitor progress
- 💡 Get Insights: Receive personalized recommendations  
- 🔗 LinkedIn Integration: Connect your network to goals
- 📈 Weekly Updates: Get progress reports via email

Get started: {{dashboardUrl}}

Need help? Contact us at {{supportEmail}} or visit {{helpUrl}}

© 2024 LinkedGoals. All rights reserved.`,
  },

  weekly_update: {
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly Goal Progress</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
        .content { padding: 30px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .stat-card { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #0066cc; margin: 0; }
        .stat-label { font-size: 14px; color: #666; margin: 5px 0 0 0; }
        .quote-section { background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-style: italic; }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: 600; 
            margin: 15px 0; 
        }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .unsubscribe { color: #999; font-size: 11px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Your Weekly Progress</h1>
        </div>
        <div class="content">
            <h2>Hi {{firstName}},</h2>
            <p>Here's how you're doing with your goals this week:</p>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <p class="stat-number">{{goalsCompleted}}</p>
                    <p class="stat-label">Goals Completed</p>
                </div>
                <div class="stat-card">
                    <p class="stat-number">{{goalsInProgress}}</p>
                    <p class="stat-label">Goals In Progress</p>
                </div>
            </div>
            
            <div class="quote-section">
                <p>"{{motivationalQuote}}"</p>
            </div>
            
            <p>Keep up the great work! Every step forward is progress worth celebrating.</p>
            
            <div style="text-align: center;">
                <a href="{{dashboardUrl}}" class="cta-button">View Full Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 LinkedGoals. All rights reserved.</p>
            <p class="unsubscribe"><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe from weekly updates</a></p>
        </div>
    </div>
</body>
</html>`,
    textContent: `Hi {{firstName}},

Your Weekly Goal Progress 📊

Goals Completed: {{goalsCompleted}}
Goals In Progress: {{goalsInProgress}}

"{{motivationalQuote}}"

Keep up the great work!

View your full dashboard: {{dashboardUrl}}

Unsubscribe: {{unsubscribeUrl}}

© 2024 LinkedGoals. All rights reserved.`,
  },

  announcement: {
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedGoals Update</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
        .content { padding: 30px; }
        .announcement-content { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .signature { margin-top: 20px; font-style: italic; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 LinkedGoals Update</h1>
        </div>
        <div class="content">
            <h2>{{subject}}</h2>
            
            <div class="announcement-content">
                {{content}}
            </div>
            
            <div class="signature">
                <p>Best regards,<br>{{adminName}}<br>LinkedGoals Team</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 LinkedGoals. All rights reserved.</p>
            <p style="font-size: 11px;"><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe from announcements</a></p>
        </div>
    </div>
</body>
</html>`,
    textContent: `LinkedGoals Update: {{subject}}

{{content}}

Best regards,
{{adminName}}
LinkedGoals Team

Unsubscribe: {{unsubscribeUrl}}

© 2024 LinkedGoals. All rights reserved.`,
  },
};

export async function setupEmailTemplates(): Promise<void> {
  try {
    console.log("🎯 Setting up email templates...");

    for (const [templateName, template] of Object.entries(emailTemplates)) {
      console.log(`📧 Creating template: ${templateName}`);
      await EmailService.createEmailTemplate(
        templateName,
        template.htmlContent,
        template.textContent
      );
      console.log(`✅ Template created: ${templateName}`);
    }

    console.log("🎉 All email templates have been set up successfully!");
  } catch (error) {
    console.error("❌ Error setting up email templates:", error);
    throw error;
  }
}

// Auto-run when this file is executed directly
if (require.main === module) {
  setupEmailTemplates().catch(console.error);
}
