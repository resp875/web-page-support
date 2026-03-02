import { AndroidTestRequestJob } from "@/lib/android-test-request-store";

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
  async enroll(): Promise<EnrollmentResult> {
    return {
      ok: false,
      errorCode: "GOOGLE_PLAY_NOT_IMPLEMENTED",
      errorMessage: "Google Play integration is not implemented yet",
    };
  }
}

export function getAndroidTestEnrollmentService(): AndroidTestEnrollmentService {
  const provider = (process.env.ANDROID_ENROLLMENT_PROVIDER || "mock").toLowerCase();

  if (provider === "google-play") {
    return new GooglePlayAndroidTestEnrollmentService();
  }

  return new MockAndroidTestEnrollmentService();
}
