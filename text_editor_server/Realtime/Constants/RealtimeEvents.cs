namespace text_editor_server.Realtime.Constants
{
    public class RealtimeEvents
    {

        /// Sự kiện được gửi đến những người dùng đang xem section đó khi có sự thay đổi về presence của section đó
        public const string
            SectionPresenceUpdated =
                nameof(SectionPresenceUpdated);

        public const string
            SectionLockUpdated =
                nameof(SectionLockUpdated);
    }
}
