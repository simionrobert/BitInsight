using System;
using System.Collections.Generic;
using System.Text;

namespace WatcherDataLayer.Models
{
    public class SetIPs
    {
        public String ID { get; set; }
        public IEnumerable<String> IPs{ get; set; }
        public String Date { get; set; }

    }
}
