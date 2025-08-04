
import { createThirdwebClient } from "thirdweb";

/**
 * Create a singleton thirdweb client with enhanced security validation.
 * The client validates the clientId and implements proper error handling.
 */
function validateClientId(clientId) {
  if (!clientId) {
    console.warn("NEXT_PUBLIC_TW_CLIENT_ID is required");
    return null;
  }
  if (typeof clientId !== 'string' || clientId.length < 10) {
    console.warn("Invalid client ID format");
    return null;
  }
  return clientId;
}

const clientId = validateClientId(process.env.NEXT_PUBLIC_TW_CLIENT_ID);

export const client = clientId ? createThirdwebClient({
  clientId: clientId,
}) : null;

// Add client validation check
export const isClientValid = () => {
  try {
    return Boolean(client && process.env.NEXT_PUBLIC_TW_CLIENT_ID);
  } catch {
    return false;
  }
};
