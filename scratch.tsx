import { renderToString } from "react-dom/server";
import { Smile } from "lucide-react";

const svg = renderToString(<Smile color="red" />);
console.log(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
