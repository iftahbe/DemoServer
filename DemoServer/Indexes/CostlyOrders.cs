﻿using System;
using System.Linq;
using DemoServer.Entities;
using Raven.Client.Documents.Indexes;

namespace DemoServer.Indexes
{
    public class CostlyOrders : AbstractIndexCreationTask<Order>
    {
        public class Result
        {
            public string OrderId;
            public TimeSpan Delay;
            public decimal Price;
        }

        public CostlyOrders()
        {
            Map = orders => from order in orders
                            select new
                            {
                                OrderId = order.Id,
                                Delay = order.ShippedAt - order.OrderedAt,
                                Price = order.Lines.Sum(x => (x.Quantity * x.PricePerUnit) * (1 - x.Discount))
                            };
        }
    }
}
