import { executeCode } from "./services/code-execution.service";
import { ProgrammingLanguage } from "@repo/db/client";

const result = await executeCode(
  `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b;
    return 0;
}
`,
  ProgrammingLanguage.CPP,
  "10 20",
);

console.log(result);