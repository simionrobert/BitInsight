using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Nest;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Linq;

namespace WatcherDataLayer.Models
{
    public class Torrent
    {
        public String ID { get; set; }
        public String Name { get; set; }
        public String Search { get; set; }
        public String Type { get; set; }
        public IEnumerable<String> Categories { get; set; }
        public IEnumerable<File> Files { get; set; }
        public String Date
        {
            get; set;
        }

        public String MagnetLink
        {
            get
            {
                String urlString = "magnet:?xt=urn:btih:" + this.ID + "&dn=" + this.Name;
                Uri url = new Uri(urlString);
                return url.AbsoluteUri;
            }
        }

    }
}
