namespace text_editor_server.Realtime.Constants
{
    public class RealtimeGroups
    {

        //Section nào cũng có một group riêng để những người dùng đang xem section đó có thể nhận được cập nhật về section đó
        public static string Section (Guid SectionId)
        {
            return $"Section-{SectionId}";
        }
    }
}
