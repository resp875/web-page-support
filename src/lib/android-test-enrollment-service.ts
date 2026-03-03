import { AndroidTestRequestJob } from "@/lib/android-test-request-store";
import { importPKCS8, SignJWT } from "jose";

export interface EnrollmentSuccessResult {
  ok: true;
  testJoinUrl: string;
}

export interface EnrollmentFailureResult {
  ok: false;
  errorCode: string;
  errorMessage: string;
}

export type EnrollmentResult = EnrollmentSuccessResult | EnrollmentFailureResult;

export interface AndroidTestEnrollmentService {
  enroll(job: AndroidTestRequestJob): Promise<EnrollmentResult>;
}

interface TrackTesters {
  googleGroups: string[];
}

class MockAndroidTestEnrollmentService implements AndroidTestEnrollmentService {
  async enroll(job: AndroidTestRequestJob): Promise<EnrollmentResult> {
    if (process.env.ANDROID_MOCK_FORCE_FAIL === "true") {
      return {
        ok: false,
        errorCode: "MOCK_PLAY_API_ERROR",
        errorMessage: "Mock failure from enrollment service",
      };
    }

    const failSuffixes = (process.env.ANDROID_MOCK_FAIL_SUFFIXES || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (failSuffixes.some((suffix) => job.requestId.endsWith(suffix))) {
      return {
        ok: false,
        errorCode: "MOCK_PLAY_API_ERROR",
        errorMessage: "Mock failure from enrollment service",
      };
    }

    return {
      ok: true,
      testJoinUrl:
        process.env.ANDROID_TEST_JOIN_URL ||
        "https://play.google.com/apps/testing/com.example.resp",
    };
  }
}

class GooglePlayAndroidTestEnrollmentService implements AndroidTestEnrollmentService {
  private getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`MISSING_ENV:${name}`);
    }
    return value;
  }

  private async getAccessToken(scopes: string[], subject?: string): Promise<string> {
    const serviceAccountEmail = this.getEnvVar("GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL");
    const privateKey = this.getEnvVar("GOOGLE_PLAY_PRIVATE_KEY").replace(/\\n/g, "\n");

    const key = await importPKCS8(privateKey, "RS256");

    const assertionPayload: Record<string, string> = {
      scope: scopes.join(" "),
    };

    const assertionBuilder = new SignJWT(assertionPayload)
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(serviceAccountEmail)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt()
      .setExpirationTime("5m");

    if (subject) {
      assertionBuilder.setSubject(subject);
    }

    const assertion = await assertionBuilder.sign(key);

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_AUTH_FAILED:${text}`);
    }

    const tokenData = (await response.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error("GOOGLE_AUTH_FAILED:access_token_not_found");
    }

    return tokenData.access_token;
  }

  private async addGroupMember(accessToken: string, groupAddress: string, memberEmail: string): Promise<void> {
    const response = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupAddress)}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: memberEmail,
          role: "MEMBER",
        }),
      },
    );

    if (response.status === 409) {
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_ADD_GROUP_MEMBER_FAILED:${text}`);
    }
  }

  private async createEdit(accessToken: string, packageName: string): Promise<string> {
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_CREATE_EDIT_FAILED:${text}`);
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      throw new Error("GOOGLE_CREATE_EDIT_FAILED:edit_id_not_found");
    }

    return data.id;
  }

  private async getTrackTesters(accessToken: string, packageName: string, editId: string, track: string): Promise<TrackTesters> {
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits/${encodeURIComponent(editId)}/testers/${encodeURIComponent(track)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (response.status === 404) {
      throw new Error("GOOGLE_TRACK_NOT_FOUND");
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_GET_TESTERS_FAILED:${text}`);
    }

    const data = (await response.json()) as { googleGroups?: string[] };

    return {
      googleGroups: Array.isArray(data.googleGroups) ? data.googleGroups : [],
    };
  }

  private async updateTrackTesters(
    accessToken: string,
    packageName: string,
    editId: string,
    track: string,
    testers: TrackTesters,
  ): Promise<void> {
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits/${encodeURIComponent(editId)}/testers/${encodeURIComponent(track)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ googleGroups: testers.googleGroups }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_UPDATE_TESTERS_FAILED:${text}`);
    }
  }

  private async commitEdit(accessToken: string, packageName: string, editId: string): Promise<void> {
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/edits/${encodeURIComponent(editId)}:commit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GOOGLE_COMMIT_EDIT_FAILED:${text}`);
    }
  }

  async enroll(job: AndroidTestRequestJob): Promise<EnrollmentResult> {
    try {
      const packageName = this.getEnvVar("GOOGLE_PLAY_PACKAGE_NAME");
      const track = process.env.GOOGLE_PLAY_TRACK || "closed";
      const groupAddress = this.getEnvVar("GOOGLE_PLAY_TESTERS_GROUP");
      const requesterEmail = job.requesterEmail;

      const playAccessToken = await this.getAccessToken([
        "https://www.googleapis.com/auth/androidpublisher",
      ]);
      const adminUserEmail = process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL;

      if (adminUserEmail) {
        if (!requesterEmail) {
          throw new Error("MISSING_REQUESTER_EMAIL");
        }

        const directoryAccessToken = await this.getAccessToken(
          ["https://www.googleapis.com/auth/admin.directory.group.member"],
          adminUserEmail,
        );
        await this.addGroupMember(directoryAccessToken, groupAddress, requesterEmail);
      }

      const editId = await this.createEdit(playAccessToken, packageName);
      const existingTesters = await this.getTrackTesters(playAccessToken, packageName, editId, track);

      const nextTesters: TrackTesters = {
        googleGroups: Array.from(new Set([...existingTesters.googleGroups, groupAddress])),
      };

      await this.updateTrackTesters(playAccessToken, packageName, editId, track, nextTesters);
      await this.commitEdit(playAccessToken, packageName, editId);

      const joinUrl =
        process.env.ANDROID_TEST_JOIN_URL ||
        `https://play.google.com/apps/testing/${packageName}`;

      return {
        ok: true,
        testJoinUrl: joinUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        errorCode: "GOOGLE_PLAY_ENROLLMENT_FAILED",
        errorMessage: message,
      };
    }
  }
}

export function getAndroidTestEnrollmentService(): AndroidTestEnrollmentService {
  const provider = (process.env.ANDROID_ENROLLMENT_PROVIDER || "manual").toLowerCase();

  if (provider === "google-play") {
    return new GooglePlayAndroidTestEnrollmentService();
  }

  return new MockAndroidTestEnrollmentService();
}
