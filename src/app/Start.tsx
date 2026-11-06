import { Page } from "../ui/Page.tsx";

/** Entry without a quiz link. URL input and recent quizzes follow in T13. */
export function Start() {
  return (
    <Page>
      <h1>Quiz</h1>
      <p>
        Öffne einen Quiz-Link, den du von deiner Lehrkraft oder aus der Klasse
        bekommen hast.
      </p>
    </Page>
  );
}
