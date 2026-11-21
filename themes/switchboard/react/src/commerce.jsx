import React,{useState} from 'react';
import {currency,products,orders,useLocal,id,iso,dateLabel} from './model';
import {Page,Card,Badge,Dialog,Field,DataTable,Blank} from './ui';
import {orderColumns} from './dashboards';

const statusOptions=['Processing','Paid','Shipped','Refunded'];
const productIcons=['◒','▧','▤','∿','┬','◇'];
const ProductArt=({product})=><div className={'product-art tint '+product.tone} aria-hidden="true">{productIcons[products.indexOf(product)]}</div>;

export function Commerce({screen,detail,cart,setCart}) {
    const [query,setQuery]=useState('');
    const [category,setCategory]=useState('');
    const [records,setRecords]=useLocal('orders',orders);
    const [editing,setEditing]=useState(null);
    const [notice,setNotice]=useState('');
    const product=products.find(item=>item.id===detail);
    const lines=products.filter(item=>cart[item.id]>0);
    const total=lines.reduce((sum,item)=>sum+item.price*cart[item.id],0);
    const categories=[...new Set(products.map(item=>item.category))];
    const quantity=(item,amount)=>setCart(items=>({...items,[item.id]:Math.max(0,Math.min(item.stock,amount))}));
    const add=item=>{
        setCart(items=>({...items,[item.id]:Math.min(item.stock,(items[item.id]||0)+1)}));
        setNotice(item.name+' added to cart.');
    };

    if(screen==='catalog'&&detail) return product?<Page title={product.name} actions={<a className="button" href="#/catalog">Back to catalogue</a>}>
        <div className="split-even"><ProductArt product={product}/><Card title={currency(product.price)} subtitle={product.category}><p>{product.description}</p><p>{product.stock} in stock</p><button className="primary" onClick={()=>add(product)} disabled={(cart[product.id]||0)>=product.stock}>Add to cart</button><p role="status">{notice}</p></Card></div>
    </Page>:<Blank title="Product unavailable" text="Choose another product in the catalogue."/>;
    if(screen==='catalog') return <Page title="Catalogue" actions={<a className="button" href="#/cart">View cart ({lines.length})</a>}>
        <div className="toolbar"><Field label="Find products"><input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></Field><Field label="Category"><select value={category} onChange={event=>setCategory(event.target.value)}><option value="">All categories</option>{categories.map(value=><option key={value}>{value}</option>)}</select></Field></div>
        <p className="sr" role="status">{notice}</p>
        <div className="cards-three">{products.filter(item=>(!category||category===item.category)&&item.name.toLowerCase().includes(query.trim().toLowerCase())).map(item=><Card key={item.id}>
            <ProductArt product={item}/><div className="spread"><h2><a href={'#/catalog/'+item.id}>{item.name}</a></h2><strong>{currency(item.price)}</strong></div><p>{item.description}</p>
            <button onClick={()=>add(item)} disabled={(cart[item.id]||0)>=item.stock}>Add to cart{cart[item.id]?' ('+cart[item.id]+')':''}</button>
        </Card>)}</div>
    </Page>;
    if(screen==='cart') return <Page title="Cart" actions={<a className="button" href="#/catalog">Continue shopping</a>}>
        {lines.length?<div className="split-app"><Card title="Items">{lines.map(item=><div className="line-item" key={item.id}>
            <div><strong>{item.name}</strong><p>{currency(item.price)} per item</p></div><div className="toolbar qty">
            <button aria-label={'Remove one '+item.name} onClick={()=>quantity(item,cart[item.id]-1)}>−</button><output aria-label={item.name+' quantity'}>{cart[item.id]}</output>
            <button aria-label={'Add one '+item.name} onClick={()=>quantity(item,cart[item.id]+1)} disabled={cart[item.id]>=item.stock}>+</button></div>
        </div>)}</Card><Card title="Order total"><p className="big">{currency(total)}</p><form className="stack" onSubmit={event=>{
            event.preventDefault();const customer=new FormData(event.currentTarget).get('customer').trim();if(!customer)return;
            const record={id:'SW-'+id(),customer,item:lines.map(item=>cart[item.id]+' × '+item.name).join(', '),total,date:iso(new Date()),status:'Processing',channel:'Direct',email:''};
            setRecords(items=>[record,...items]);setCart({});location.hash='/orders';
        }}><Field label="Customer name" name="customer" required maxLength={100}/><button className="primary">Create demo order</button><small>Uses sample checkout. No payment details are collected.</small></form></Card></div>:<Blank title="Your cart is empty" text="Add a product from the catalogue."/>}
    </Page>;
    const invoice=records.find(item=>item.id===detail);
    if(detail) return invoice?<Page title={(screen==='orders'?'Order ':'Invoice ')+invoice.id} actions={<div className="toolbar"><a className="button" href={'#/'+screen}>Back to {screen}</a>{screen==='invoices'&&<button onClick={()=>window.print()}>Print invoice</button>}</div>}>
        <Card title="Switchboard Studio" className="invoice"><p>Issued {dateLabel(invoice.date)} · <Badge>{invoice.status}</Badge></p><h2>Billed to</h2><p>{invoice.customer}</p><div className="spread"><span>{invoice.item}</span><strong>{currency(invoice.total)}</strong></div><p className="big">{currency(invoice.total)}</p></Card>
    </Page>:<Blank title="Invoice unavailable" text="Choose another record from the invoice register."/>;
    return <Page title={screen==='invoices'?'Invoices':'Orders'}>
        <DataTable rows={records} columns={screen==='invoices'?[{key:'id',label:'Invoice',render:row=><a href={'#/invoices/'+row.id}>View {row.id}</a>},...orderColumns.slice(1)]:orderColumns} title={screen==='invoices'?'Invoice register':'Recent orders'} onEdit={screen==='orders'?setEditing:undefined}/>
        {editing&&<Dialog title={'Edit '+editing.id} close={()=>setEditing(null)}><form className="stack" onSubmit={event=>{
            event.preventDefault();const status=new FormData(event.currentTarget).get('status');setRecords(items=>items.map(item=>item.id===editing.id?{...item,status}:item));setEditing(null);
        }}><Field label="Order status"><select name="status" defaultValue={editing.status}>{statusOptions.map(status=><option key={status}>{status}</option>)}</select></Field><button className="primary">Save order</button></form></Dialog>}
    </Page>;
}
