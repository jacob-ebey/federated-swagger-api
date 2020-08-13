import { h } from "preact";
import { Suspense, lazy } from "preact/compat";
import { useCallback, useState } from "preact/hooks";

import Shell from "../components/shell";
// import usePromise from "../hooks/use-promise";

import quote from "swquotes/api/SWQuote/RandomStarWarsQuoteFromFaction/{faction}?faction=1";

export default function HomePage() {
  const [count, setCount] = useState(1);

  const increment = useCallback(() => {
    setCount(count + 1);
  }, [count, setCount]);

  // const [result, error, state] = usePromise(
  //   () =>
  //     import(`swquotes/api/SWQuote/RandomStarWarsQuoteFromFaction/{faction}?faction=${count}`).then((r) => r.default),
  //   [count]
  // );

  return (
    <Shell>
      <h1>Hello, World!</h1>

      <button onClick={increment}>Count: {count}</button>

      <p>{quote.starWarsQuote}</p>
    </Shell>
  );
}
