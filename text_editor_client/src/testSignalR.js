import * as signalR
from "@microsoft/signalr";

const HUB_URL =
    "https://localhost:8001/hubs/collaboration";

let connection = null;

export async function
testSignalR() {

    try {

        // =====================
        // tránh connect nhiều lần
        // =====================

        if (
            connection &&
            connection.state ===
            signalR
                .HubConnectionState
                .Connected
        ) {

            console.log(
                "[SignalR] already connected"
            );

            return;
        }

        // =====================
        // create connection
        // =====================

        connection =
            new signalR
                .HubConnectionBuilder()

                .withUrl(
                    HUB_URL,
                    {
                        accessTokenFactory:
                            () =>
                                localStorage
                                    .getItem(
                                        "accessToken"
                                    ) || ""
                    }
                )

                .withAutomaticReconnect()

                .configureLogging(
                    signalR.LogLevel.Information
                )

                .build();

        // =====================
        // lifecycle
        // =====================

        connection.onreconnecting(
            error => {

                console.warn(
                    "[SignalR] reconnecting",
                    error
                );
            }
        );

        connection.onreconnected(
            connectionId => {

                console.log(
                    "[SignalR] reconnected",
                    connectionId
                );
            }
        );

        connection.onclose(
            error => {

                console.warn(
                    "[SignalR] disconnected",
                    error
                );
            }
        );

        // =====================
        // realtime listeners
        // =====================

        connection.on(
            "SectionPresenceUpdated",
            data => {

                console.log(
                    "========== PRESENCE =========="
                );

                console.log(data);
            }
        );

        connection.on(
            "SectionLockUpdated",
            data => {

                console.log(
                    "========== LOCK =========="
                );

                console.log(data);
            }
        );

        // =====================
        // start
        // =====================

        await connection.start();

        console.log(
            "[SignalR] CONNECTED"
        );

        console.log(
            "ConnectionId:",
            connection.connectionId
        );

        // =====================
        // browser helper
        // =====================

        window.signalRTest = {

            connection,

            // -----------------
            // status
            // -----------------

            state:
                () =>
                    connection.state,

            isConnected:
                () =>
                    connection.state ===
                    signalR
                        .HubConnectionState
                        .Connected,

            connectionId:
                () =>
                    connection.connectionId,

            // -----------------
            // section
            // -----------------

            joinSection:
                async (
                    sectionId
                ) => {

                    console.log(
                        "[SignalR] JoinSection",
                        sectionId
                    );

                    return await
                        connection.invoke(
                            "JoinSection",
                            {
                                sectionId
                            }
                        );
                },

            leaveSection:
                async () => {

                    return await
                        connection.invoke(
                            "LeaveCurrentSection"
                        );
                },

            // -----------------
            // lock
            // -----------------

            requestLock:
                async (
                    sectionId
                ) => {

                    return await
                        connection.invoke(
                            "RequestEditSession",
                            sectionId
                        );
                },

            releaseLock:
                async (
                    sectionId
                ) => {

                    return await
                        connection.invoke(
                            "ReleaseEditSession",
                            sectionId
                        );
                },

            disconnect:
                async () => {

                    await connection
                        .stop();
                }
        };

        console.log(
            "[SignalR] READY"
        );

        console.log(
            "Use: window.signalRTest"
        );
    }
    catch (error) {

        console.error(
            "[SignalR] ERROR:",
            error
        );
    }
}