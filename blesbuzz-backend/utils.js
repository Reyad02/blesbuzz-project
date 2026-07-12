const mail_template = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Pro-StreamZ</title>
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:30px 15px;">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<!-- Header -->
<tr>
<td align="center" style="background:#0f172a;padding:40px 20px;">

<img src="cid:logo" width="180" alt="Pro-StreamZ">

<h1 style="color:white;margin-top:20px;margin-bottom:5px;font-size:28px;">
Welcome to Pro-StreamZ
</h1>

<p style="color:#cbd5e1;font-size:16px;margin:0;">
Your IPTV subscription is now active.
</p>

</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:35px;">

<p style="font-size:18px;color:#333;">
Hello <strong>{{customer_name}}</strong>,
</p>

<p style="font-size:15px;color:#555;line-height:26px;">
Thank you for choosing <strong>Pro-StreamZ</strong>.
Your IPTV account has been successfully created.
Below are your login credentials.
</p>

</td>
</tr>

<!-- Credentials -->
<tr>
<td style="padding:0 35px 35px;">

<table width="100%" cellpadding="12" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;">

<tr style="background:#f8fafc;">
<td width="35%" style="font-weight:bold;">Username</td>
<td>{{username}}</td>
</tr>

<tr>
<td style="font-weight:bold;">Password</td>
<td>{{password}}</td>
</tr>

<tr style="background:#f8fafc;">
<td style="font-weight:bold;">Server URL</td>
<td>{{server_url}}</td>
</tr>

<tr>
<td style="font-weight:bold;">Expiration Date</td>
<td>{{expiry_date}}</td>
</tr>

</table>

</td>
</tr>

<!-- Instructions -->
<tr>
<td style="padding:0 35px 35px;">

<h3 style="margin-bottom:10px;color:#111827;">
Setup Instructions
</h3>

<ol style="color:#555;line-height:28px;padding-left:20px;">

<li>Download your preferred IPTV Player.</li>

<li>Choose <strong>Xtream Codes Login</strong>.</li>

<li>Enter your Server URL, Username, and Password.</li>

<li>Or simply import your M3U Playlist URL.</li>

<li>Enjoy your IPTV subscription.</li>

</ol>

</td>
</tr>

<!-- CTA -->
<tr>
<td align="center" style="padding-bottom:40px;">

<a href="https://prostreamz.com/"
style="
display:inline-block;
padding:15px 35px;
background:#2563eb;
color:white;
text-decoration:none;
border-radius:8px;
font-size:16px;
font-weight:bold;">
Visit Our Website
</a>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#0f172a;padding:30px;text-align:center;">

<p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">
Need Help?
</p>

<p style="margin:10px 0;color:#cbd5e1;">
Email: prostreamz@yahoo.com
</p>

<p style="margin:0;color:#94a3b8;font-size:13px;">
© 2026 Pro-StreamZ. All Rights Reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`

module.exports = mail_template;