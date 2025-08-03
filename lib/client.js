
import { createThirdwebClient } from "thirdweb";

/**
 * Create a singleton thirdweb client with enhanced security validation.
 * The client validates the clientId and implements proper error handling.
 */
function validateClientId(clientId) {
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_TW_CLIENT_ID is required");
  }
  if (typeof clientId !== 'string' || clientId.length < 32) {
    throw new Error("Invalid client ID format");
  }
  return clientId;
}

export const client = createThirdwebClient({
  clientId: validateClientId(process.env.NEXT_PUBLIC_TW_CLIENT_ID),
});

// Add client validation check
export const isClientValid = () => {
  try {
    return Boolean(client && process.env.NEXT_PUBLIC_TW_CLIENT_ID);
  } catch {
    return false;
  }
};
