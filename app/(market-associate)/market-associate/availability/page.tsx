import { AvailabilityChecksWorkspace } from "@/components/runner/AvailabilityChecksWorkspace";
import { RunnerActivitySubNav } from "@/components/runner/RunnerActivitySubNav";

export default function RunnerAvailabilityPage() {
  return (
    <>
      <RunnerActivitySubNav />
      <AvailabilityChecksWorkspace />
    </>
  );
}
