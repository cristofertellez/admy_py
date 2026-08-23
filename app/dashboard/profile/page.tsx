import { requireAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { AvatarUpload } from "./avatar-upload";
import { ChangePasswordForm } from "./change-password-form";
import { PreferencesForm } from "./preferences-form";
import { ProfileInfoForm } from "./profile-info-form";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Profile</h1>
        <p className="mt-1 text-body-sm text-muted">Manage your account settings.</p>
      </div>

      <Card>
        <CardContent>
          <AvatarUpload name={`${user.first_name} ${user.last_name}`.trim()} avatar={user.avatar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileInfoForm
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
            phone={user.phone}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            initialPreferences={{
              language: user.language ?? "en",
              timezone: user.timezone ?? "UTC",
              theme: user.theme ?? "dark",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
