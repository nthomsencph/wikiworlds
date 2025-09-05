from unittest.mock import MagicMock, patch

from app.backend_pre_start import init, logger


def test_init_successful_connection() -> None:
    engine_mock = MagicMock()

    session_mock = MagicMock()
    exec_mock = MagicMock(return_value=True)
    session_mock.exec.return_value = exec_mock

    # Mock Session to return session_mock when used as context manager
    session_class_mock = MagicMock()
    session_class_mock.return_value.__enter__.return_value = session_mock
    session_class_mock.return_value.__exit__.return_value = None

    with (
        patch("app.backend_pre_start.Session", session_class_mock),
        patch.object(logger, "info"),
        patch.object(logger, "error"),
        patch.object(logger, "warn"),
    ):
        try:
            init(engine_mock)
            connection_successful = True
        except Exception:
            connection_successful = False

        assert (
            connection_successful
        ), "The database connection should be successful and not raise an exception."

        # Verify exec was called once with any select statement
        session_mock.exec.assert_called_once()
        # Verify the call was made with a select statement
        call_args = session_mock.exec.call_args[0][0]
        assert str(call_args).startswith(
            "SELECT"
        ), "Should be called with a SELECT statement"
