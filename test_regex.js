
const regex = /<update>\s*<update_analysis>(.*?)<\/update_analysis>\s*<json_patch>(.*?)<\/json_patch>\s*<\/update>/gsi;

const testString = `
<update>
  <update_analysis>
  This is the analysis.
  It can span multiple lines.
  </update_analysis>
  <json_patch>
  [
    {"op": "replace", "path": "/foo", "value": "bar"}
  ]
  </json_patch>
</update>
`;

const match = regex.exec(testString);

if (match) {
    console.log("Match found!");
    console.log("Group 1 (Analysis):", match[1].trim());
    console.log("Group 2 (Patch):", match[2].trim());
} else {
    console.log("No match.");
}
