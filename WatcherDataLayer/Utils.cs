using System;
using System.Collections.Generic;
using System.Text;

namespace WatcherDataLayer
{
    public static class Utils
    {
        public static String ParseSortField(string sortField)
        {
            switch (sortField)
            {
                case "type":
                    return "Type.keyword";
                case "name":
                    return "Name.keyword";
                case "date":
                    return "Date";
                case "size":
                    return "Size";
                case "peerNumber":
                    return "Peers";
                default:
                    return null;
            }
        }
    }
}
