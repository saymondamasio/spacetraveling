import { NextApiRequest, NextApiResponse } from 'next';
import url from 'url';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
): Promise<void> {
  // Exit the current user from "Preview Mode". This function accepts no args.
  response.clearPreviewData();

  const queryObject = url.parse(request.url, true).query;
  const redirectUrl =
    queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

  response.writeHead(307, { Location: redirectUrl });
  response.end();
}
