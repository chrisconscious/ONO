import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to the ONO business operations platform.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        These terms govern use of the ONO business operations platform. By
        creating an account or using a workspace, you agree to them on behalf of
        yourself and the organisation that invited you.
      </p>

      <h2>Accounts</h2>
      <p>
        You must provide accurate account details, keep your credentials
        confidential, and tell your administrator promptly if you believe your
        account or a session has been compromised. Creating an account does not
        by itself grant access to any organisation&apos;s workspace. Workspace
        access is granted by that organisation&apos;s administrators.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use the platform only for lawful business purposes.</li>
        <li>
          Do not attempt to access another tenant&apos;s data, bypass
          permissions, or interfere with the service.
        </li>
        <li>
          Do not upload malware, infringe intellectual property, or submit
          content you are not entitled to share.
        </li>
      </ul>

      <h2>Data and availability</h2>
      <p>
        Business records you create belong to the organisation whose workspace
        you use. Signing out, an expired session, or account suspension does not
        delete business records. The service is provided on an as-available
        basis; planned maintenance and security fixes may interrupt access.
      </p>

      <h2>Security</h2>
      <p>
        Sessions are time-limited and can be revoked. Administrative actions are
        audited. You are responsible for protecting the devices and mailboxes you
        use to sign in.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms should go to your workspace administrator or
        the platform team that operates your ONO deployment.
      </p>
    </>
  );
}
