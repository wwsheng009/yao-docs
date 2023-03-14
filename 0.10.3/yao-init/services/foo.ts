
/**
 * Cloud Function
 *
 * POST /api/__yao/app/service/foo
 * {"method":"Bar", "args":["hello", "world"]}
 *
 * @param  {...any} args
 * @returns
 */
function Bar(...args: any[]) {
  return {
    message: $L("Another yao application") + " (Cloud Function: foo.Bar)",
    args: args,
  };
}
