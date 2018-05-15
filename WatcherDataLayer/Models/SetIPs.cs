using System;
using System.Collections.Generic;
using System.Text;

namespace WatcherDataLayer.Models
{
    public class SetIPs
    {
        public IEnumerable<IPModel> IPs{ get; set; }
        public String Date { get; set; }

        public class IPModel
        {
            public String IP;
            public int port;
            public GeoIP geoip;
        }

        public class GeoIP
        {
            public String city_name;
            public String continent_name;
            public String country_iso_code;
            public Location location;
            public String region_name;
        }

        public class Location
        {
            public double lat;
            public double lon;
        }
    }
}
