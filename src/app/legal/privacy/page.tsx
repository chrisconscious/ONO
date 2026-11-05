import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ONO handles account and business information.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        ONO is a multi-tenant business platform. This summary explains the
        information needed to operate your account and workspace securely.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, password hash,
          account status, verification state and presentation preferences.
        </li>
        <li>
          <strong>Workspace data:</strong> the business records, memberships,
          roles and activity created inside an organisation&apos;s workspace.
        </li>
        <li>
          <strong>Security data:</strong> session metadata (device description,
          IP address, timestamps), audit events and rate-limit counters.
        </li>
      </ul>

      <h2>How information is used</h2>
      <p>
        Account and security data is used to authenticate you, enforce tenant
        isolation, protect against abuse, and let administrators manage access.
        Business records are used to provide the workspace features your
        organisation has enabled.
      </p>

      <h2>Cookies</h2>
      <p>
        ONO uses a small number of essential cookies: an HTTP-only session cookie,
        a remembered workspace selection, and a short-lived notice explaining why
        a session ended. These cookies are not used for advertising. Preference
        choices may also be stored locally in your browser so the interface
        restores your selected theme.
      </p>

      <h2>Retention and access</h2>
      <p>
        Sessions expire automatically and can be revoked at any time. Audit and
        security records are retained according to the deployment&apos;s
        operational requirements. Access to workspace data is limited to members
        of that workspace and authorised platform administrators.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update your profile and preferences, change your password, review
        active sessions and sign out of every device from your account settings.
        Contact your workspace administrator for access or deletion requests
        relating to workspace data.
      </p>
    </>
  );
}
