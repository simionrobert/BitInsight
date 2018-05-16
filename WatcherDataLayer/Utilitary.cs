using System;
using System.Collections.Generic;
using System.Text;

namespace WatcherDataLayer
{
    public static class Utilitary
    {
        public static void ParseSortField(ref String sortField)
        {
            switch (sortField)
            {
                case "type":
                    sortField = "Type";
                    break;
                case "name":
                    sortField = "Name.keyword";
                    break;
                case "date":
                    sortField = "Date";
                    break;
                case "size":
                    sortField = "Size";
                    break;
                case "peerNumber":
                    sortField = "Peers";
                    break;
                default:
                    sortField = null;
                    break;
            }
        }
    }
}
