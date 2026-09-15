export default {
  default: {
    override: {
      wrapper: "cloudflare",
      converter: "edge",
      incrementalCache: "s3",
      tagCache: "dynamodb",
      queue: "sqs",
    },
  },
};