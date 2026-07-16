/**
 * Sends a standardized HTTP response with a given structure.
 *
 * @param {Object} response - The Express response object used to send the HTTP response.
 * @param {Object|null} [data=null] - The data to include in the response. Defaults to null if not provided.
 * @param {string} [message=""] - A message describing the response. Defaults to an empty string.
 * @param {boolean} [responseType=false] - Indicates the type of response (e.g., success or failure). Defaults to false.
 * @param {boolean} [toast=false] - Whether a toast message should be shown on the frontend. Defaults to false.
 * @param {number} [statusCode=200] - The HTTP status code of the response. Defaults to 200.
 *
 * @example
 * // Send a success response with data
 * generalResponse(res, { id: 1, name: "John" }, "Request successful", true, true, 200);
 *
 * @example
 * // Send an error response with a custom status code
 * generalResponse(res, null, "An error occurred", false, false, 500);
 */

exports.generalResponse = (
    response,
    data = null,
    message = "",
    responseType = false,
    toast = false,
    statusCode = 200
) => {
    response.status(statusCode).send({
        status: responseType,
        data: data,
        message: message,
        toast: toast,
    });
};
